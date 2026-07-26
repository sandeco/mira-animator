/* =====================================================================
   memoria-evidencia.test.mjs
   ---------------------------------------------------------------------
   Captura de evidência do Salvar (memória semântica, slice 1).

   Duas metades:
   1) o diff puro do mira-edit.js, extraído do arquivo pelos marcadores
      "--- delta de evidência: bloco puro (sem DOM) ---" (é browser code,
      não dá para importar; o teste roda o código que vai para o deck);
   2) o endpoint /__mira_prefs dos dois servidores de autoria, de verdade
      no ar, gravando num MIRA_MEMORY_DIR temporário.

   Rodar:  node --test tests/memoria-evidencia.test.mjs
   ===================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFileSync, rmSync, mkdtempSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ---------- extração do código que roda no navegador ---------- */
function extrair(arquivo, ini, fim, retorno) {
    const src = readFileSync(join(RAIZ, arquivo), 'utf8');
    const a = src.indexOf(ini);
    const b = src.indexOf(fim);
    assert.ok(a !== -1 && b > a, 'marcadores não encontrados em ' + arquivo);
    return new Function(src.slice(a, b) + '; return ' + retorno + ';')();
}

const { prefsDelta, prefsSlide } = extrair(
    'templates/authoring/mira-edit.js',
    '/* --- delta de evidência: bloco puro (sem DOM) --- */',
    '/* --- fim do bloco puro --- */',
    '{ prefsDelta, prefsReadOps, prefsSlide }'
);
const remapId = extrair(
    'templates/authoring/mira-edit-free.js',
    'function remapId(', 'function serialize(', 'remapId'
);

/* deck com o bloco cumulativo do mira-edit-free (ops === null: deck virgem) */
function deck(ops) {
    if (ops === null) return '<html><body><section>a</section></body></html>';
    const json = JSON.stringify({ v: 1, ops }).replace(/</g, '\\u003c');
    return '<html><body><section>a</section>' +
        '<script id="mira-free-edits" type="application/json">' + json + '</script></body></html>';
}

const ANTIGOS = [{ id: 'me-0-3', tx: 10 }, { id: 'me-1-2', text: 'oi' }];

test('primeira edição do deck gera uma evidência nova', () => {
    const d = prefsDelta(deck(null), deck([{ id: 'me-0-3', tx: 10 }]));
    assert.equal(d.length, 1);
    assert.equal(d[0].tipo, 'novo');
    assert.equal(d[0].slide, 0);
});

test('bloco cumulativo: segunda sessão sem editar não re-registra nada', () => {
    assert.deepEqual(prefsDelta(deck(ANTIGOS), deck(ANTIGOS)), []);
});

test('segunda sessão editando um elemento: só ele vira evidência', () => {
    const d = prefsDelta(deck(ANTIGOS), deck([{ id: 'me-0-3', tx: 10 }, { id: 'me-1-2', text: 'tchau' }]));
    assert.equal(d.length, 1);
    assert.equal(d[0].tipo, 'alterado');
    assert.equal(d[0].op_id, 'me-1-2');
    assert.equal(d[0].antes.text, 'oi');
    assert.equal(d[0].depois.text, 'tchau');
});

test('op que sumiu do bloco vira evidência de remoção', () => {
    const d = prefsDelta(deck(ANTIGOS), deck([{ id: 'me-0-3', tx: 10 }]));
    assert.equal(d.length, 1);
    assert.equal(d[0].tipo, 'removido');
});

/* currentPerm() devolve, para cada slide na ordem NOVA, o índice ORIGINAL.
   remapId faz perm.indexOf(velho) => novo. Permutação assimétrica pega
   inversão de direção, que uma permutação de dois slides esconderia. */
test('remapId leva id velho para o espaço novo (permutação assimétrica)', () => {
    const perm = [2, 0, 1];   // novo 0 = velho 2, novo 1 = velho 0, novo 2 = velho 1
    assert.equal(remapId('me-2-1', perm), 'me-0-1');
    assert.equal(remapId('me-0-1', perm), 'me-1-1');
    assert.equal(remapId('me-1-1', perm), 'me-2-1');
});

test('reorder assimétrico sem edição não gera evidência', () => {
    const perm = [2, 0, 1];
    const velhos = [{ id: 'me-0-1', tx: 5 }, { id: 'me-1-4', text: 'b' }, { id: 'me-2-2', rot: 3 }];
    const novos = velhos.map((o) => ({ ...o, id: remapId(o.id, perm) }));
    assert.deepEqual(prefsDelta(deck(velhos), deck(novos), (id) => remapId(id, perm)), []);
    /* sem o remap da baseline, o mesmo Salvar inflaria o log em 6 linhas */
    assert.equal(prefsDelta(deck(velhos), deck(novos), null).length, 6);
});

test('reorder junto com uma edição de verdade gera uma evidência só', () => {
    const perm = [1, 0];
    const novos = ANTIGOS.map((o) => ({ ...o, id: remapId(o.id, perm) }));
    const comEdicao = novos.map((o) => (o.id === remapId('me-1-2', perm) ? { ...o, text: 'novo' } : o));
    const d = prefsDelta(deck(ANTIGOS), deck(comEdicao), (id) => remapId(id, perm));
    assert.equal(d.length, 1);
    assert.equal(d[0].tipo, 'alterado');
});

test('bookkeeping de crop não conta como intenção do usuário', () => {
    const d = prefsDelta(
        deck([{ id: 'me-0-3', cropT: 5, baseT: 'none', baseClip: 'x' }]),
        deck([{ id: 'me-0-3', cropT: 5, baseT: 'translate(0)', baseClip: 'y' }])
    );
    assert.deepEqual(d, []);
});

test('bloco corrompido na baseline não derruba a captura', () => {
    const d = prefsDelta('<script id="mira-free-edits" type="application/json">{quebrado</script>',
        deck([{ id: 'me-0-1', tx: 3 }]));
    assert.equal(d.length, 1);
});

test('slide de elemento duplicado sai do id', () => {
    assert.equal(prefsSlide('me-dup-2-me-4-7'), 4);
    assert.equal(prefsSlide('sem-padrao'), null);
});

/* ---------- endpoint /__mira_prefs, servidores de verdade ---------- */
function payload(episodio) {
    return {
        schema: 'delta-cru-v1', episodio, fonte: 'edicao', ts: '2026-07-26T10:00:00.000Z',
        deck: 'C:\\decks\\x\\index.html', titulo: 'Deck X',
        itens: [
            { op_id: 'me-0-3', slide: 0, tipo: 'alterado', antes: { tx: 0 }, depois: { tx: 40 } },
            { op_id: 'me-1-2', slide: 1, tipo: 'novo', antes: null, depois: { text: 'oi' } }
        ]
    };
}

async function comServidor(args, env, porta, fn) {
    const mem = mkdtempSync(join(tmpdir(), 'mira-mem-'));
    const proc = spawn(process.execPath, args, {
        env: { ...process.env, ...env, MIRA_MEMORY_DIR: mem }, stdio: 'ignore'
    });
    const base = 'http://127.0.0.1:' + porta;
    try {
        for (let i = 0; i < 60; i++) {
            try { await fetch(base + '/'); break; } catch (e) { await sleep(150); }
        }
        await fn(base, join(mem, 'evidencia.jsonl'));
    } finally {
        proc.kill();
        rmSync(mem, { recursive: true, force: true });
    }
}

async function checarEndpoint(base, log) {
    const post = (body) => fetch(base + '/__mira_prefs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
    });

    let r = await post(payload('ep-1'));
    assert.equal(r.status, 200);
    assert.equal((await r.json()).linhas, 2);

    assert.equal((await post(payload('ep-2'))).status, 200);

    const linhas = readFileSync(log, 'utf8').trim().split('\n');
    assert.equal(linhas.length, 4, 'append-only: nada foi sobrescrito');
    const um = JSON.parse(linhas[0]);
    assert.equal(um.schema, 'delta-cru-v1');
    assert.equal(um.id, 'ep-1-0');
    assert.equal(um.op_id, 'me-0-3');
    assert.equal(um.slide, 0);
    assert.equal(um.depois.tx, 40);
    assert.equal(JSON.parse(linhas[3]).episodio, 'ep-2');

    await post({ schema: 'delta-cru-v1', episodio: 'vazio', itens: [] });
    assert.equal(readFileSync(log, 'utf8').trim().split('\n').length, 4, 'delta vazio não grava');

    r = await fetch(base + '/__mira_prefs', { method: 'POST', body: '{quebrado' });
    assert.ok(r.status >= 400, 'json inválido responde erro');
    assert.ok((await fetch(base + '/')).status < 500, 'servidor continua no ar');
}

test('lib/mira-serve.js grava evidência append-only', async () => {
    await comServidor([join(RAIZ, 'lib/mira-serve.js'), RAIZ, '5399'], {}, 5399, checarEndpoint);
});

test('mira-studio-server.cjs grava evidência append-only', async () => {
    await comServidor(
        [join(RAIZ, 'templates/studio/mira-studio-server.cjs')],
        { MIRA_STUDIO_NO_OPEN: '1', PORT: '5398' }, 5398, checarEndpoint
    );
});
