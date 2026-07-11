#!/usr/bin/env node
/* =====================================================================
   mira-remote-server.cjs  ·  Espelhamento e controle pelo celular
   ---------------------------------------------------------------------
   Sobe um servidor leve na rede local que faz duas coisas:
     1. SERVE o deck desta pasta (o celular pega o slide pela LAN).
     2. SINCRONIZA estado entre os aparelhos (SSE para descer,
        POST para subir). O servidor é só o carteiro: guarda o último
        estado e reemite; o deck é a fonte da verdade.

   Papéis por IP (spec specs/remote-control/protocolo.md):
     127.0.0.1 / ::1      -> palco (o notebook que apresenta)
     primeiro IP externo  -> controle (o celular do professor)
     demais IPs externos  -> espelho (só recebe; POSTs são ignorados)

   Zero dependências (Node >= 18). Não use este arquivo para autoria:
   o mira-serve.js (salvar edições) continua sendo outro processo,
   escutando só em localhost.

   Uso: node mira-remote-server.cjs   (ou o atalho "Apresentar com celular")
   ===================================================================== */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const ROOT = __dirname;                     // a pasta do deck
const BASE_PORT = Number(process.env.PORT) || 3000;
const PORT_TRIES = 10;                      // 3000..3009 (RF-11)

/* ================= QR code (encoder embutido, modo byte, ECC M, v1-4) ==== */
/* Validado por round-trip com decodificador real (jsQR). Cobre até 62
   bytes, mais que qualquer URL de LAN. */
const QR_EXP = new Array(512), QR_LOG = new Array(256);
(function () {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    QR_EXP[i] = x; QR_LOG[x] = i;
    x <<= 1; if (x & 0x100) x ^= 0x11D;
  }
  for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255];
})();
const qrGmul = (a, b) => (a && b) ? QR_EXP[QR_LOG[a] + QR_LOG[b]] : 0;

function qrRsEncode(data, ecLen) {
  let gen = [1];
  for (let i = 0; i < ecLen; i++) {
    const next = new Array(gen.length + 1).fill(0);
    for (let j = 0; j < gen.length; j++) {
      next[j] ^= qrGmul(gen[j], QR_EXP[i]);
      next[j + 1] ^= gen[j];
    }
    gen = next;
  }
  gen.reverse();
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift(); res.push(0);
    if (factor) for (let i = 0; i < ecLen; i++) res[i] ^= qrGmul(gen[i + 1], factor);
  }
  return res;
}

const QR_VERSIONS = [
  null,
  { data: 16, ec: 10, blocks: 1, align: [] },
  { data: 28, ec: 16, blocks: 1, align: [6, 18] },
  { data: 44, ec: 26, blocks: 1, align: [6, 22] },
  { data: 64, ec: 18, blocks: 2, align: [6, 26] },
];

function qrMatrix(text) {
  const bytes = Array.from(Buffer.from(text, 'utf8'));
  let v = 0;
  for (let i = 1; i < QR_VERSIONS.length; i++) {
    if (bytes.length <= QR_VERSIONS[i].data - 2) { v = i; break; }
  }
  if (!v) throw new Error('texto longo demais para o QR');
  const info = QR_VERSIONS[v];
  const size = 17 + 4 * v;

  const bits = [];
  const push = (val, len) => { for (let i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); };
  push(0b0100, 4);
  push(bytes.length, 8);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, info.data * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const dataCw = [];
  for (let i = 0; i < bits.length; i += 8) {
    let b = 0; for (let j = 0; j < 8; j++) b = (b << 1) | bits[i + j];
    dataCw.push(b);
  }
  for (let p = 0; dataCw.length < info.data; p++) dataCw.push(p % 2 ? 0x11 : 0xEC);

  const per = info.data / info.blocks;
  const blocks = [], ecs = [];
  for (let b = 0; b < info.blocks; b++) {
    const chunk = dataCw.slice(b * per, (b + 1) * per);
    blocks.push(chunk);
    ecs.push(qrRsEncode(chunk, info.ec));
  }
  const all = [];
  for (let i = 0; i < per; i++) for (const bl of blocks) all.push(bl[i]);
  for (let i = 0; i < info.ec; i++) for (const ec of ecs) all.push(ec[i]);

  const M = Array.from({ length: size }, () => new Array(size).fill(null));
  const finder = (r, c) => {
    for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= size || cc < 0 || cc >= size) continue;
      const on = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6) &&
        (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4));
      M[rr][cc] = on ? 1 : 0;
    }
  };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  if (info.align.length) {
    for (const cr of info.align) for (const cc of info.align) {
      if (M[cr][cc] !== null) continue;
      for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) {
        M[cr + dr][cc + dc] = Math.max(Math.abs(dr), Math.abs(dc)) !== 1 ? 1 : 0;
      }
    }
  }
  for (let i = 8; i < size - 8; i++) {
    if (M[6][i] === null) M[6][i] = i % 2 === 0 ? 1 : 0;
    if (M[i][6] === null) M[i][6] = i % 2 === 0 ? 1 : 0;
  }
  M[4 * v + 9][8] = 1;
  const fmtCells = [];
  for (let i = 0; i <= 8; i++) { if (i !== 6) fmtCells.push([8, i], [i, 8]); }
  for (let i = 0; i < 8; i++) fmtCells.push([8, size - 1 - i]);
  for (let i = 0; i < 7; i++) fmtCells.push([size - 1 - i, 8]);
  for (const [r, c] of fmtCells) if (M[r][c] === null) M[r][c] = 0;

  const isFunction = M.map(row => row.map(cell => cell !== null));

  const dataBits = [];
  for (const cw of all) for (let i = 7; i >= 0; i--) dataBits.push((cw >> i) & 1);
  let bi = 0, upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;
    for (let i = 0; i < size; i++) {
      const r = upward ? size - 1 - i : i;
      for (const c of [col, col - 1]) {
        if (isFunction[r][c]) continue;
        M[r][c] = bi < dataBits.length ? dataBits[bi++] : 0;
      }
    }
    upward = !upward;
  }

  const MASKS = [
    (r, c) => (r + c) % 2 === 0,
    (r, c) => r % 2 === 0,
    (r, c) => c % 3 === 0,
    (r, c) => (r + c) % 3 === 0,
    (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
    (r, c) => (r * c) % 2 + (r * c) % 3 === 0,
    (r, c) => ((r * c) % 2 + (r * c) % 3) % 2 === 0,
    (r, c) => ((r + c) % 2 + (r * c) % 3) % 2 === 0,
  ];
  function penalty(m) {
    let score = 0;
    for (let axis = 0; axis < 2; axis++) {
      for (let i = 0; i < size; i++) {
        let run = 1;
        for (let j = 1; j < size; j++) {
          const cur = axis ? m[j][i] : m[i][j];
          const prev = axis ? m[j - 1][i] : m[i][j - 1];
          if (cur === prev) run++;
          else { if (run >= 5) score += run - 2; run = 1; }
        }
        if (run >= 5) score += run - 2;
      }
    }
    for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
      const x = m[r][c];
      if (m[r][c + 1] === x && m[r + 1][c] === x && m[r + 1][c + 1] === x) score += 3;
    }
    const PAT = [1, 0, 1, 1, 1, 0, 1];
    for (let axis = 0; axis < 2; axis++) {
      for (let i = 0; i < size; i++) for (let j = 0; j < size - 6; j++) {
        let ok = true;
        for (let k = 0; k < 7; k++) if ((axis ? m[j + k][i] : m[i][j + k]) !== PAT[k]) { ok = false; break; }
        if (!ok) continue;
        const before = (j >= 4) && [1, 2, 3, 4].every(k => (axis ? m[j - k][i] : m[i][j - k]) === 0);
        const after = (j + 10 < size) && [7, 8, 9, 10].every(k => (axis ? m[j + k][i] : m[i][j + k]) === 0);
        if (before || after) score += 40;
      }
    }
    let dark = 0;
    for (const row of m) for (const cell of row) dark += cell;
    score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return score;
  }
  function formatBits(mask) {
    const data = (0b00 << 3) | mask; // ECC M
    let rem = data << 10;
    for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0x537 << (i - 10);
    return ((data << 10) | rem) ^ 0x5412;
  }
  function applyFormat(m, mask) {
    const f = formatBits(mask);
    const pos1 = [];
    for (let i = 0; i <= 5; i++) pos1.push([8, i]);
    pos1.push([8, 7], [8, 8], [7, 8]);
    for (let i = 5; i >= 0; i--) pos1.push([i, 8]);
    const pos2 = [];
    for (let i = 0; i < 7; i++) pos2.push([size - 1 - i, 8]);
    for (let i = 7; i >= 0; i--) pos2.push([8, size - 8 + (7 - i)]);
    for (let i = 0; i < 15; i++) {
      const bit = (f >> (14 - i)) & 1;
      m[pos1[i][0]][pos1[i][1]] = bit;
      m[pos2[i][0]][pos2[i][1]] = bit;
    }
  }
  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = M.map(row => row.slice());
    for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) {
      if (!isFunction[r][c] && MASKS[mask](r, c)) m[r][c] ^= 1;
    }
    applyFormat(m, mask);
    const s = penalty(m);
    if (s < bestScore) { bestScore = s; best = m; }
  }
  return best;
}

// SVG com módulos escuros sobre branco e zona de silêncio de 4 módulos.
function qrSvg(text) {
  const m = qrMatrix(text);
  const n = m.length, q = 4, total = n + q * 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    if (m[r][c]) d += 'M' + (c + q) + ' ' + (r + q) + 'h1v1h-1z';
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + total + ' ' + total +
    '" shape-rendering="crispEdges"><rect width="' + total + '" height="' + total +
    '" fill="#ffffff"/><path d="' + d + '" fill="#0a0a0a"/></svg>';
}

/* ================= arquivos estáticos ==================================== */
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
};

// resolve um caminho de URL para um arquivo dentro do ROOT (sem escapar dele)
function safePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const target = path.resolve(path.join(ROOT, '.' + clean));
  if (target !== ROOT && !target.startsWith(ROOT + path.sep)) return null;
  return target;
}

/* ================= estado da sessão (vive em memória, morre com o processo) */
let state = { slide: 0, reveal: 0 };
let draw = [];                 // traços do telestrator, em coordenadas do palco
let tacticsBag = {};           // estado dos quadros táticos, por caminho do arquivo
let ts = 0;                    // carimbo incremental (EC-07 / RP-05)
let firstExternalIp = null;    // controle: fixado na 1ª conexão externa (RF-08)
const sseClients = new Set();  // conexões /events abertas
let lanUrl = '';               // http://<ip-lan>:<porta>, montado no listen

function normalizeIp(raw) {
  if (!raw) return '';
  return raw.startsWith('::ffff:') ? raw.slice(7) : raw;
}
function isLocalhost(ip) {
  return ip === '::1' || ip.startsWith('127.');
}
function roleOf(ip) {
  if (isLocalhost(ip)) return 'stage';
  if (ip === firstExternalIp) return 'control';
  return 'mirror';
}
function externalsCount() {
  const ips = new Set();
  for (const c of sseClients) if (!isLocalhost(c.miraIp)) ips.add(c.miraIp);
  return ips.size;
}
function payload() {
  return JSON.stringify({
    ...state, draw, ts,
    tactics: tacticsBag,
    clients: sseClients.size,
    externals: externalsCount(),
    url: lanUrl,
  });
}
function broadcast() {
  const data = `data: ${payload()}\n\n`;
  for (const c of sseClients) { try { c.write(data); } catch { sseClients.delete(c); } }
}
function readBody(req, res, limit, cb) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; if (body.length > limit) req.destroy(); });
  req.on('end', () => { cb(body); res.writeHead(204); res.end(); });
}

/* ================= servidor ============================================== */
const server = http.createServer((req, res) => {
  const ip = normalizeIp(req.socket.remoteAddress);
  const url = req.url.split('?')[0];

  // a primeira conexão externa da sessão vira o controle (lock, RF-08)
  if (!isLocalhost(ip) && !firstExternalIp) {
    firstExternalIp = ip;
    console.log(`  celular conectado: ${ip} (controle)`);
  }

  // shell do remote (palco 16:9 + QR + controles) para todos os aparelhos
  if (req.method === 'GET' && url === '/') {
    const shell = path.join(ROOT, 'mira-remote.html');
    return fs.readFile(shell, (err, html) => {
      if (err) { res.writeHead(500); return res.end('mira-remote.html não encontrado na pasta do deck'); }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    });
  }

  // quem sou eu (papel + URL da LAN): a shell decide a própria UI com isso
  if (req.method === 'GET' && url === '/__mira_remote/me') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ role: roleOf(ip), url: lanUrl }));
  }

  // QR da URL da LAN (com a URL digitável como fallback na shell)
  if (req.method === 'GET' && url === '/__mira_remote/qr.svg') {
    try {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'no-store' });
      return res.end(qrSvg(lanUrl));
    } catch (e) {
      res.writeHead(500); return res.end('');
    }
  }

  // canal de descida (SSE): registra, manda o join-state, reemite a cada mudança
  if (req.method === 'GET' && url === '/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.miraIp = ip;
    sseClients.add(res);
    res.write('retry: 2000\n');
    res.write(`data: ${payload()}\n\n`);   // join-state (RP-04)
    broadcast();                            // atualiza contagem nos demais
    req.on('close', () => { sseClients.delete(res); broadcast(); });
    return;
  }

  // subida de navegação: só palco e controle mandam (espelho é ignorado, 204)
  if (req.method === 'POST' && url === '/state') {
    return readBody(req, res, 100 * 1024, (body) => {
      if (roleOf(ip) === 'mirror') return;
      try {
        const next = JSON.parse(body);
        state = { slide: next.slide | 0, reveal: next.reveal | 0 };
        ts++;
        broadcast();
      } catch { /* payload inválido é ignorado em silêncio (RP-01) */ }
    });
  }

  // subida de desenho: array completo de traços em coordenadas do palco
  if (req.method === 'POST' && url === '/draw') {
    return readBody(req, res, 2 * 1024 * 1024, (body) => {
      if (roleOf(ip) === 'mirror') return;
      try {
        const next = JSON.parse(body);
        if (Array.isArray(next)) { draw = next; ts++; broadcast(); }
      } catch { /* RP-01 */ }
    });
  }

  // subida do quadro tático (mira-tactics): estado completo de um quadro,
  // identificado pelo caminho do arquivo (um deck pode ter vários quadros)
  if (req.method === 'POST' && url === '/tactics') {
    return readBody(req, res, 1024 * 1024, (body) => {
      if (roleOf(ip) === 'mirror') return;
      try {
        const next = JSON.parse(body);
        if (next && typeof next.id === 'string' && next.state) {
          tacticsBag[next.id] = next.state; ts++; broadcast();
        }
      } catch { /* RP-01 */ }
    });
  }

  // demais GETs: arquivos do deck. /index.html com ?stage=1 (o iframe da
  // shell) recebe a flag que desliga a UI local do mira-draw.
  if (req.method === 'GET') {
    let target = safePath(url);
    if (!target) { res.writeHead(400); return res.end('caminho inválido'); }
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) { res.writeHead(404); return res.end('não encontrado'); }
    return fs.readFile(target, (err, buf) => {
      if (err) { res.writeHead(500); return res.end('erro: ' + err.message); }
      const ext = path.extname(target).toLowerCase();
      if (ext === '.html' && /(\?|&)stage=1\b/.test(req.url)) {
        let html = buf.toString('utf8');
        const flag = '<script>window.__MIRA_REMOTE_STAGE__=true;</script>';
        html = /<head[^>]*>/i.test(html)
          ? html.replace(/<head[^>]*>/i, (m) => m + flag)
          : flag + html;
        res.writeHead(200, { 'Content-Type': TYPES['.html'] });
        return res.end(html);
      }
      res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
      res.end(buf);
    });
  }

  res.writeHead(404); res.end();
});

// ping periódico mantém as conexões SSE vivas
setInterval(() => {
  for (const c of sseClients) { try { c.write(': ping\n\n'); } catch { sseClients.delete(c); } }
}, 30000).unref();

/* ================= porta com fallback + abrir o navegador =============== */
function lanIps() {
  const out = [];
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const net of ifaces[name] || []) {
      if (net.family === 'IPv4' && !net.internal) out.push(net.address);
    }
  }
  // redes privadas primeiro (o QR usa a primeira da lista)
  out.sort((a, b) => (/^(192\.168\.|10\.|172\.)/.test(b) ? 1 : 0) - (/^(192\.168\.|10\.|172\.)/.test(a) ? 1 : 0));
  return out;
}

function openBrowser(url) {
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(cmd, () => { /* se não abrir sozinho, a URL está no console */ });
}

function listen(port, triesLeft) {
  const onError = (err) => {
    if (err.code === 'EADDRINUSE' && triesLeft > 0) {
      listen(port + 1, triesLeft - 1);   // RF-11: porta ocupada, tenta a próxima
    } else {
      console.error('\n  Não consegui abrir uma porta (' + err.code + ').');
      process.exit(1);
    }
  };
  server.once('error', onError);
  server.listen(port, () => {
    server.removeListener('error', onError);
    const ips = lanIps();
    lanUrl = ips.length ? `http://${ips[0]}:${port}` : `http://localhost:${port}`;
    console.log('\n  Mira remote  ·  apresentar com o celular');
    console.log('  ─────────────────────────────────────────');
    console.log(`  deck:        ${ROOT}`);
    console.log(`  no notebook: http://localhost:${port}`);
    if (ips.length) {
      console.log(`  no celular:  ${lanUrl}   (mesma rede/Wi-Fi, ou escaneie o QR na tela)`);
    } else {
      console.log('  (nenhuma rede local encontrada; conecte o notebook a uma rede ou hotspot)');
    }
    console.log('\n  Se o Windows perguntar sobre o firewall, clique em PERMITIR');
    console.log('  (inclusive em redes públicas/hotspot). Ctrl+C encerra.\n');
    if (!process.env.MIRA_REMOTE_NO_OPEN) openBrowser(`http://localhost:${port}`);
  });
}

listen(BASE_PORT, PORT_TRIES - 1);
