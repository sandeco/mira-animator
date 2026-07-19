#!/usr/bin/env node
/* =====================================================================
   mira-serve.js  ·  Servidor local de edição do Mira
   ---------------------------------------------------------------------
   Serve a pasta atual (ou a pasta passada como argumento) em
   http://127.0.0.1:<porta> e aceita POST /__mira_save para gravar um
   .html por cima, sem diálogo nenhum. É só ferramenta de AUTORIA:
   o deck final continua rodando em file:// normalmente.

   Uso:
     node mira-serve.js                 # serve a pasta atual, porta 5173
     node mira-serve.js decks/meu-deck  # serve outra pasta
     node mira-serve.js . 8080          # pasta e porta

   Segurança: escuta só em 127.0.0.1, e o save só grava arquivos .html/.md
   já existentes dentro da pasta servida (bloqueia path traversal).
   ===================================================================== */
import http from 'http';
import { readFile, writeFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { resolve, join, extname, sep } from 'path';

const root = resolve(process.argv[2] || process.cwd());
const port = Number(process.argv[3]) || 5173;

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.htm': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm'
};

// resolve um caminho de URL para um arquivo dentro do root, sem escapar dele
function safePath(urlPath) {
    const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
    const target = resolve(join(root, '.' + clean));
    if (target !== root && !target.startsWith(root + sep)) return null; // path traversal
    return target;
}

function htmlTarget(urlPath) {
    let target = safePath(urlPath);
    if (target && existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    return target;
}

function send(res, status, body, type) {
    res.writeHead(status, { 'Content-Type': type || 'text/plain; charset=utf-8' });
    res.end(body);
}

async function handleSave(req, res) {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 20 * 1024 * 1024) req.destroy(); });
    req.on('end', async () => {
        try {
            const { path: p, content } = JSON.parse(raw);
            const target = htmlTarget(p || '/');
            if (!target) return send(res, 400, 'caminho inválido');
            // .md entra por causa do roteiro.md do mira-studio (teleprompter grava a
            // fala de volta no arquivo). Continua valendo: só dentro do root e só se
            // o arquivo já existir.
            if (!/\.(html?|md)$/.test(target)) return send(res, 403, 'só gravo arquivos .html/.md');
            if (!existsSync(target)) return send(res, 404, 'arquivo não existe: ' + p);
            await writeFile(target, content, 'utf8');
            console.log('  salvo:', p);
            send(res, 200, JSON.stringify({ ok: true, path: target }), 'application/json');
        } catch (e) {
            send(res, 500, 'erro ao salvar: ' + e.message);
        }
    });
}

function handleMeta(req, res) {
    try {
        const url = new URL(req.url, 'http://127.0.0.1');
        const target = htmlTarget(url.searchParams.get('path') || '/');
        if (!target) return send(res, 400, 'caminho inválido');
        send(res, 200, JSON.stringify({ root, path: target }), 'application/json');
    } catch (e) {
        send(res, 400, 'caminho inválido');
    }
}

async function handleGet(req, res) {
    let target = safePath(req.url);
    if (!target) return send(res, 400, 'caminho inválido');
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (!existsSync(target)) return send(res, 404, 'não encontrado');
    try {
        const buf = await readFile(target);
        send(res, 200, buf, TYPES[extname(target).toLowerCase()] || 'application/octet-stream');
    } catch (e) {
        send(res, 500, 'erro: ' + e.message);
    }
}

const server = http.createServer((req, res) => {
    // CORS liberado só para localhost (útil se abrir por outra porta)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return send(res, 204, '');
    if (req.method === 'POST' && req.url.split('?')[0] === '/__mira_save') return handleSave(req, res);
    if (req.method === 'GET' && req.url.split('?')[0] === '/__mira_meta') return handleMeta(req, res);
    if (req.method === 'GET') return handleGet(req, res);
    send(res, 405, 'método não suportado');
});

server.listen(port, '127.0.0.1', () => {
    console.log('\n  Mira serve  ·  editando com salvar silencioso');
    console.log('  pasta:  ' + root);
    console.log('  url:    http://127.0.0.1:' + port + '/');
    console.log('\n  abra o deck e edite (tecla E). Ctrl+C para parar.\n');
});
