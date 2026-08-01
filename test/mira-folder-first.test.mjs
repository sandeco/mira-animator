import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const skills = [
  'mira-new',
  'mira-studio',
  'mira-studio-full',
  'mira-fast',
  'mira-ultrafast',
];

test('toda criação de deck ordena a estrutura como primeira ação', () => {
  for (const skill of skills) {
    const source = readFileSync(new URL(`../agents/${skill}/SKILL.md`, import.meta.url), 'utf8');
    assert.match(source, /primeira ação/i, `${skill}: falta declarar primeira ação`);
    assert.match(source, /references\//, `${skill}: falta references/`);
    assert.match(source, /assets\/vendor\//, `${skill}: falta assets/vendor/`);
    assert.match(source, /mira\//, `${skill}: falta mira/`);
    assert.match(source, /YYYY-MM-DD <slug>/, `${skill}: falta prefixo de data`);
    assert.match(source, /toda a árvore interna/i, `${skill}: falta criação integral da árvore`);

    const firstAction = source.search(/primeira ação/i);
    const firstQuestion = source.search(/pergunt/i);
    assert.ok(firstAction >= 0 && (firstQuestion < 0 || firstAction < firstQuestion), `${skill}: pergunta aparece antes da ordem`);
  }
});

test('studio e studio-full criam pastas antes de colher roteiro', () => {
  for (const skill of ['mira-studio', 'mira-studio-full']) {
    const source = readFileSync(new URL(`../agents/${skill}/SKILL.md`, import.meta.url), 'utf8');
    const steps = source.slice(source.indexOf('## Passos'));
    assert.ok(steps.indexOf('1. **Criar toda a estrutura') < steps.indexOf('2. **Colher o roteiro'));
  }
});

test('modos rápidos incluem o diretório de execução na fase zero', () => {
  for (const skill of ['mira-fast', 'mira-ultrafast']) {
    const source = readFileSync(new URL(`../agents/${skill}/SKILL.md`, import.meta.url), 'utf8');
    assert.match(source, /mira\/fast\//);
  }
});
