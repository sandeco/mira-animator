/**
 * Teste T2 do prd.md seção 10: o vínculo é verificável por comando, sem
 * depender de agente obedecer.
 *
 * O deck é montado à mão aqui dentro, de propósito: prova o mecanismo antes de
 * existir qualquer agente para alimentá-lo, e com zero risco de regressão.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verify, detectarVinculo } from '../lib/storyboard/verify.mjs';

function deck({ brief = true, quadros = ['slide-01.svg', 'slide-02.svg'], html, briefing } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mira-verify-'));
  const sb = path.join(dir, 'storyboard');
  fs.mkdirSync(path.join(sb, 'approved'), { recursive: true });
  if (brief) fs.writeFileSync(path.join(sb, 'concept-brief.md'), '# Concept Brief\n');
  for (const q of quadros) fs.writeFileSync(path.join(sb, 'approved', q), '<svg/>');
  fs.writeFileSync(path.join(dir, 'index.html'), html ?? '');
  if (briefing !== undefined) {
    fs.mkdirSync(path.join(dir, 'references'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'references', 'briefings-de-cena.md'), briefing);
  }
  return dir;
}

const marcador = (q) => `<!-- @MIRA:CONCEPT quadro="approved/${q}" intent="x" -->`;
const doisSlidesOk =
  `<section>${marcador('slide-01.svg')}<h2>a</h2></section>` +
  `<section>${marcador('slide-02.svg')}<h2>b</h2></section>`;

test('deck sem storyboard/ é NÃO VINCULADO e não é defeito', () => {
  const d = deck({ brief: false, quadros: [], html: '<section>a</section>' });
  const r = verify(d);
  assert.equal(r.vinculado, false);
  assert.equal(r.conforme, true);
  assert.match(r.nota, /NÃO VINCULADO/);
});

test('brief sem quadro aprovado é NÃO VINCULADO, e a nota diz qual metade falta', () => {
  const d = deck({ brief: true, quadros: [], html: '<section>a</section>' });
  const r = verify(d);
  assert.equal(r.vinculado, false);
  assert.match(r.nota, /valida..o visual/i);
});

test('quadro aprovado sem brief é NÃO VINCULADO, com a nota invertida', () => {
  const d = deck({ brief: false, html: '<section>a</section>' });
  const r = verify(d);
  assert.equal(r.vinculado, false);
  assert.match(r.nota, /conceito não foi fechado/i);
});

test('deck vinculado e conforme: todo slide marcado, nenhum quadro órfão', () => {
  const d = deck({ html: doisSlidesOk });
  const r = verify(d);
  assert.equal(r.vinculado, true);
  assert.equal(r.slides, 2);
  assert.equal(r.marcados, 2);
  assert.deepEqual(r.slidesSemMarcador, []);
  assert.deepEqual(r.quadrosOrfaos, []);
  assert.equal(r.conforme, true);
});

// A falha exata que este repositório mediu: o conceito existe em disco e não
// chega no slide. Antes, nada notava.
test('slide sem marcador é acusado, com o número do slide', () => {
  const d = deck({
    html: `<section>${marcador('slide-01.svg')}</section><section><h2>sem marcador</h2></section>`,
  });
  const r = verify(d);
  assert.deepEqual(r.slidesSemMarcador, [2]);
  assert.equal(r.conforme, false);
});

test('marcador apontando para quadro inexistente é referência quebrada', () => {
  const d = deck({
    html: `<section>${marcador('slide-01.svg')}</section><section>${marcador('slide-99.svg')}</section>`,
  });
  const r = verify(d);
  assert.equal(r.marcadoresQuebrados.length, 1);
  assert.equal(r.marcadoresQuebrados[0].slide, 2);
  assert.equal(r.conforme, false);
});

test('quadro="none" é caso previsto, não referência quebrada', () => {
  const d = deck({
    quadros: ['slide-01.svg'],
    html:
      `<section>${marcador('slide-01.svg')}</section>` +
      `<section><!-- @MIRA:CONCEPT quadro="none" intent="slide sem quadro" --></section>`,
  });
  const r = verify(d);
  assert.deepEqual(r.marcadoresQuebrados, []);
  assert.equal(r.marcados, 2);
  assert.equal(r.conforme, true);
});

test('quadro aprovado que nenhum slide cita é reportado, sem reprovar o deck', () => {
  const d = deck({
    quadros: ['slide-01.svg', 'slide-02.svg', 'slide-03.svg'],
    html: doisSlidesOk,
  });
  const r = verify(d);
  assert.deepEqual(r.quadrosOrfaos, ['slide-03.svg']);
  assert.equal(r.conforme, true, 'órfão pode ser normal: o storyboard representa o conceito, não o deck');
});

test('briefing sem a seção "## Conceito aprovado" reprova', () => {
  const d = deck({ html: doisSlidesOk, briefing: '# Briefings\n\n## Slide 1\nqualquer coisa\n' });
  const r = verify(d);
  assert.deepEqual(r.briefingsSemSecao, ['briefings-de-cena.md']);
  assert.equal(r.conforme, false);
});

test('briefing com a seção passa', () => {
  const d = deck({
    html: doisSlidesOk,
    briefing: '# Briefings\n\n## Slide 1\n\n## Conceito aprovado\n- **Quadro:** x\n',
  });
  const r = verify(d);
  assert.deepEqual(r.briefingsSemSecao, []);
  assert.equal(r.conforme, true);
});

// O PNG é a renderização do quadro, não o quadro. Se `--no-png` ou uma falha do
// Chrome mudassem o status do deck, o mesmo deck responderia coisas diferentes.
test('o quadro de registro é o .svg: PNG ausente não desvincula o deck', () => {
  const d = deck({ html: doisSlidesOk });
  const antes = detectarVinculo(d).vinculado;
  fs.writeFileSync(path.join(d, 'storyboard', 'approved', 'slide-01.png'), 'x');
  fs.rmSync(path.join(d, 'storyboard', 'approved', 'slide-01.png'));
  assert.equal(antes, true);
  assert.equal(detectarVinculo(d).vinculado, true);
});

test('verify NUNCA escreve nada no deck', () => {
  const d = deck({ html: doisSlidesOk });
  const antes = JSON.stringify(fs.readdirSync(d, { recursive: true }).sort());
  verify(d);
  const depois = JSON.stringify(fs.readdirSync(d, { recursive: true }).sort());
  assert.equal(antes, depois);
});

test('caminho que não é deck falha alto', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'mira-nao-deck-'));
  assert.throws(() => verify(d), /não parece um deck/);
});
