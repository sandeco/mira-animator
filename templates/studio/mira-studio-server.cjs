#!/usr/bin/env node
/* =====================================================================
   mira-studio-server.cjs  ·  Servidor local do Mira Studio
   ---------------------------------------------------------------------
   O Node fica em primeiro plano e só abre o Chrome depois que listen()
   confirma a porta. O retorno do comando do Chrome nunca controla a vida
   do servidor: Ctrl+C nesta janela encerra a sessão.

   /__mira/health separa a saúde HTTP do estado da enumeração de GPUs.
   /__mira/gpus expõe loading/ready/error e a coleta é uma Promise única,
   cacheada durante toda a sessão.
   ===================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFile, spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const requestedPort = Number(process.env.PORT);
const BASE_PORT = Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort < 65536
    ? requestedPort : 8123;
const PORT_TRIES = 10;
const PROFILE = process.env.MIRA_STUDIO_PROFILE ||
    (process.platform === 'win32' && process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'mira-studio', 'chrome-profile')
        : '');
const LOG_FILE = process.env.MIRA_STUDIO_LOG || path.join(__dirname, 'mira-studio.log');

const MIME = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8', '.cjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.svg': 'image/svg+xml', '.webp': 'image/webp',
    '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
    '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4',
    '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.pdf': 'application/pdf',
    '.md': 'text/markdown; charset=utf-8'
};

/* limite de uma gravação de deck: o index.html mais pesado não chega perto */
const MAX_SAVE_BYTES = 25 * 1024 * 1024;

/* resolve um caminho pedido pelo cliente DENTRO do root servido; devolve
   null em qualquer tentativa de sair dele (path traversal) */
function resolveInRoot(rel) {
    const abs = path.resolve(path.join(ROOT, '.' + rel));
    if (abs !== ROOT && !abs.startsWith(ROOT + path.sep)) return null;
    return abs;
}

function line(value) {
    return '[' + new Date().toISOString() + '] ' + String(value);
}
function appendLog(value) {
    try { fs.appendFileSync(LOG_FILE, line(value) + '\n', 'utf8'); }
    catch (e) { /* stdout continua sendo a fonte de verdade se o disco falhar */ }
}
function log(value) { console.log(value); appendLog(value); }
function fail(value) { console.error(value); appendLog('ERRO ' + value); }

appendLog('nova sessão; deck=' + ROOT + '; pid=' + process.pid);

const httpState = { status: 'starting', port: null, error: '', startedAt: null };
const shouldCollectGpus = process.platform === 'win32' || Object.prototype.hasOwnProperty.call(process.env, 'MIRA_STUDIO_GPU_FIXTURE');
const gpuState = { status: shouldCollectGpus ? 'loading' : 'unavailable', gpus: [], error: '' };
let gpuPromise = null;

function normalizedGpuNames(stdout) {
    const seen = new Set();
    return String(stdout || '').split(/\r?\n|\|/).map(function (s) { return s.trim(); })
        .filter(function (s) {
            const key = s.toLowerCase();
            if (!s || seen.has(key)) return false;
            seen.add(key);
            return true;
        });
}

/* Promise cacheada: chamadas concorrentes e novos requests observam a mesma
   consulta, em vez de iniciar vários PowerShell ou congelar uma lista vazia. */
function collectGpus() {
    if (gpuPromise) return gpuPromise;
    if (!shouldCollectGpus) {
        gpuPromise = Promise.resolve(gpuState);
        return gpuPromise;
    }
    gpuState.status = 'loading';
    const delay = Math.max(0, Math.min(Number(process.env.MIRA_STUDIO_GPU_DELAY_MS) || 0, 30000));
    gpuPromise = new Promise(function (resolve) {
        function done(err, stdout) {
            if (err) {
                gpuState.status = 'error';
                gpuState.gpus = [];
                gpuState.error = err.killed ? 'consulta de GPUs excedeu 15 s' : String(err.message || err);
                fail('enumeração de GPUs falhou: ' + gpuState.error);
            } else {
                gpuState.gpus = normalizedGpuNames(stdout);
                gpuState.status = 'ready';
                gpuState.error = '';
                log('  GPUs instaladas: ' + (gpuState.gpus.join(' | ') || '(nenhuma retornada pelo Windows)'));
            }
            resolve(gpuState);
        }
        function run() {
            /* Fixture explícita só existe para o teste automatizado Linux do
               contrato loading→ready; produção Windows sempre usa CIM. */
            if (Object.prototype.hasOwnProperty.call(process.env, 'MIRA_STUDIO_GPU_FIXTURE')) {
                if (process.env.MIRA_STUDIO_GPU_ERROR) done(new Error(process.env.MIRA_STUDIO_GPU_ERROR));
                else done(null, process.env.MIRA_STUDIO_GPU_FIXTURE);
                return;
            }
            execFile('powershell.exe',
                ['-NoProfile', '-NonInteractive', '-Command',
                    'Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name'],
                { timeout: 15000, windowsHide: true }, done);
        }
        if (delay) setTimeout(run, delay); else run();
    });
    return gpuPromise;
}

function json(res, status, value) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(value));
}

const server = http.createServer(function (req, res) {
    let url;
    try { url = decodeURIComponent((req.url || '/').split('?')[0]); }
    catch (e) { res.writeHead(400); res.end(); return; }

    if (url === '/__mira/health') {
        json(res, httpState.status === 'ready' ? 200 : 503, {
            status: httpState.status,
            root: ROOT,
            port: httpState.port,
            startedAt: httpState.startedAt,
            error: httpState.error,
            gpu: { status: gpuState.status, error: gpuState.error }
        });
        return;
    }
    if (url === '/__mira/gpus') {
        collectGpus();
        json(res, 200, {
            status: gpuState.status,
            gpus: gpuState.gpus.slice(),
            error: gpuState.error,
            retryAfterMs: gpuState.status === 'loading' ? 250 : 0
        });
        return;
    }

    /* caminho absoluto do alvo de gravação (o mira-edit usa para o rótulo da barra) */
    if (url === '/__mira_meta') {
        let rel = process.env.MIRA_STUDIO_PAGE || '/index.html';
        try { rel = new URL(req.url, 'http://x').searchParams.get('path') || rel; } catch (e) { }
        const abs = resolveInRoot(rel);
        if (!abs) { json(res, 403, { error: 'fora do root' }); return; }
        json(res, 200, { path: abs });
        return;
    }
    /* gravação no disco: o "Salvar no arquivo" do deck (bloco #mira-studio-state),
       o Salvar da barra do mira-edit e a escrita do roteiro.md pelo teleprompter.
       Só HTML/Markdown, só dentro do root. */
    if (url === '/__mira_save' && (req.method === 'POST' || req.method === 'PUT')) {
        const chunks = [];
        let size = 0, tooBig = false;
        req.on('data', function (c) {
            size += c.length;
            if (size > MAX_SAVE_BYTES) { tooBig = true; req.destroy(); }
            else chunks.push(c);
        });
        req.on('error', function () { try { json(res, 400, { error: 'erro na leitura' }); } catch (e) { } });
        req.on('end', function () {
            if (tooBig) { json(res, 413, { error: 'conteúdo grande demais' }); return; }
            let body;
            try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
            catch (e) { json(res, 400, { error: 'json inválido' }); return; }
            const rel = body && body.path;
            const content = body && body.content;
            if (typeof content !== 'string' || typeof rel !== 'string' || !rel) {
                json(res, 400, { error: 'path/content faltando' }); return;
            }
            const abs = resolveInRoot(rel);
            if (!abs) { json(res, 403, { error: 'fora do root' }); return; }
            const ext = path.extname(abs).toLowerCase();
            if (ext !== '.html' && ext !== '.htm' && ext !== '.md') { json(res, 403, { error: 'só .html/.htm/.md' }); return; }
            fs.writeFile(abs, content, 'utf8', function (err) {
                if (err) { json(res, 500, { error: String(err && err.message || err) }); return; }
                log('salvo: ' + abs + ' (' + size + ' bytes)');
                json(res, 200, { path: abs, ok: true });
            });
        });
        return;
    }

    if (url === '/') url = process.env.MIRA_STUDIO_PAGE || '/index.html';
    const file = resolveInRoot(url);
    if (!file) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, function (err, data) {
        if (err) { res.writeHead(404); res.end(); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        res.end(data);
    });
});

function chromeCandidates() {
    if (process.env.MIRA_STUDIO_CHROME) return [process.env.MIRA_STUDIO_CHROME];
    if (process.platform === 'darwin') {
        return ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
    }
    if (process.platform !== 'win32') return [];
    return [
        process.env.ProgramFiles && path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe'),
        process.env['ProgramFiles(x86)'] && path.join(process.env['ProgramFiles(x86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
        process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe')
    ].filter(Boolean);
}

function openStudio(url) {
    if (process.env.MIRA_STUDIO_NO_OPEN) return;
    const chrome = chromeCandidates().find(function (p) { return fs.existsSync(p); });
    if (!chrome) {
        log('  Chrome não encontrado automaticamente. Abra manualmente: ' + url);
        return;
    }
    const args = [
        '--no-first-run', '--no-default-browser-check', '--new-window',
        /* tela cheia opcional (launchers de gravação, ex. o 16:9): F11 já na abertura */
        process.env.MIRA_STUDIO_FULLSCREEN ? '--start-fullscreen' : '--start-maximized',
        '--force-high-performance-gpu'
    ];
    if (PROFILE) args.unshift('--user-data-dir=' + PROFILE);
    args.push(url);
    try {
        const child = spawn(chrome, args, { detached: true, stdio: 'ignore', windowsHide: false });
        child.once('error', function (e) {
            fail('não consegui abrir o Chrome: ' + (e && e.message || e));
            log('  Abra manualmente: ' + url);
        });
        child.unref();
        log('  comando do Chrome enviado; o servidor permanece ativo independentemente do retorno.');
    } catch (e) {
        fail('não consegui abrir o Chrome: ' + (e && e.message || e));
        log('  Abra manualmente: ' + url);
    }
}

function listen(port, triesLeft) {
    httpState.status = 'starting';
    httpState.port = port;
    const onListening = function () {
        server.removeListener('error', onError);
        httpState.status = 'ready';
        httpState.port = port;
        httpState.startedAt = new Date().toISOString();
        httpState.error = '';
        const url = 'http://127.0.0.1:' + port + '/';
        log('');
        log('  Mira Studio');
        log('  ─────────────────────────────────────────');
        log('  deck:     ' + ROOT);
        log('  endereço: ' + url);
        log('  saúde:    ' + url + '__mira/health');
        log('  log:      ' + LOG_FILE);
        log('  servidor pronto; Ctrl+C encerra.');
        log('  GPU dedicada é preferência do Chrome/Windows; o painel mostra o renderer realmente ativo.');
        log('');
        /* página inicial opcional (launchers alternativos, ex. o deck 16:9) */
        openStudio(url + String(process.env.MIRA_STUDIO_PAGE || '').replace(/^\//, ''));
    };
    const onError = function (err) {
        /* Um callback passado diretamente a server.listen() sobrevive ao
           EADDRINUSE e pode disparar na tentativa seguinte com a porta antiga.
           Listeners nomeados e removidos aqui impedem esse ready fantasma. */
        server.removeListener('listening', onListening);
        if (err && err.code === 'EADDRINUSE' && triesLeft > 0) {
            log('  porta ' + port + ' ocupada; tentando ' + (port + 1) + '.');
            listen(port + 1, triesLeft - 1);
            return;
        }
        httpState.status = 'error';
        httpState.error = String(err && err.message || err);
        fail('não consegui iniciar o Mira Studio: ' + httpState.error);
        fail('verifique portas, Node e permissões. Log: ' + LOG_FILE);
        process.exitCode = 1;
    };
    if (port > 65535) {
        onError(Object.assign(new Error('não há porta TCP válida após ' + (port - 1)), { code: 'EADDRNOTAVAIL' }));
        return;
    }
    server.once('error', onError);
    server.once('listening', onListening);
    try { server.listen(port, '127.0.0.1'); }
    catch (err) {
        server.removeListener('error', onError);
        server.removeListener('listening', onListening);
        onError(err);
    }
}

function shutdown(signal) {
    log('  encerrando por ' + signal + '.');
    server.close(function () { process.exit(0); });
    setTimeout(function () { process.exit(0); }, 1500).unref();
}
process.once('SIGINT', function () { shutdown('Ctrl+C'); });
process.once('SIGTERM', function () { shutdown('SIGTERM'); });

collectGpus();
listen(BASE_PORT, PORT_TRIES - 1);
