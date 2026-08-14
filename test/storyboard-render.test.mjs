import test from 'node:test';
import assert from 'node:assert/strict';
import { renderScene, validateScene } from '../lib/storyboard/render.mjs';
import { seedFor } from '../lib/storyboard/seed.mjs';

const cena = {
  slide: 3,
  concept_reference: { transformation: 'progressive-loss-of-original-information' },
  visual_intent: 'mostrar que a distância para a fonte original está aumentando',
  composition: {
    left: { object: 'photo', label: 'cópia 2', state: { degraded: 0.5 } },
    center: { object: 'copier' },
    right: { object: 'photo', label: 'cópia 3', state: { degraded: 0.75 } },
  },
  actions: [
    { arrow: { from: 'left', to: 'center' } },
    { arrow: { from: 'center', to: 'right' } },
  ],
  annotation: ['A cópia anterior agora alimenta a próxima geração.'],
};

test('semente: mesma cena e índice, mesma semente', () => {
  assert.equal(seedFor('slide-01', 0), seedFor('slide-01', 0));
  assert.notEqual(seedFor('slide-01', 0), seedFor('slide-01', 1));
  assert.notEqual(seedFor('slide-01', 0), seedFor('slide-02', 0));
});

test('semente: entrada inválida falha alto, não em silêncio', () => {
  assert.throws(() => seedFor('', 0));
  assert.throws(() => seedFor('x', -1));
  assert.throws(() => seedFor('x', 1.5));
});

// O requisito que sustenta o versionamento inteiro: sem isto, comparar duas
// versões de storyboard mostra diferença onde não houve mudança nenhuma.
test('RNF-05: render é determinístico byte a byte', () => {
  const a = renderScene(cena, 'slide-03').svg;
  const b = renderScene(cena, 'slide-03').svg;
  assert.equal(a, b);
  assert.ok(a.length > 500, 'SVG suspeito de vazio');
});

test('cenas diferentes geram traço diferente', () => {
  const a = renderScene(cena, 'slide-03').svg;
  const b = renderScene(cena, 'slide-04').svg;
  assert.notEqual(a, b);
});

test('o SVG é XML bem formado e declara o viewBox 16:9', () => {
  const { svg } = renderScene(cena, 'slide-03');
  assert.match(svg, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(svg, /viewBox="0 0 1600 900"/);
  assert.equal((svg.match(/<svg/g) || []).length, 1);
  assert.equal((svg.match(/<\/svg>/g) || []).length, 1);
});

test('visual_intent viaja como comentário dentro do SVG', () => {
  const { svg } = renderScene(cena, 'slide-03');
  assert.match(svg, /<!-- visual_intent: mostrar que a dist/);
});

test('objeto sem primitiva vira marcador, não quebra o render', () => {
  const c = { ...cena, composition: { center: { object: 'telefone_sem_fio' } }, actions: [] };
  const r = renderScene(c, 'x');
  assert.deepEqual(r.unknownObjects, ['telefone_sem_fio']);
  assert.match(r.svg, /sem primitiva/);
});

test('texto do autor é escapado: um & solto quebraria o XML', () => {
  const c = {
    ...cena,
    composition: { center: { object: 'box', label: 'A & B' } },
    actions: [],
    annotation: ['fonte <original> & cópia'],
  };
  const { svg } = renderScene(c, 'x');
  assert.match(svg, /A &amp; B/);
  assert.match(svg, /&lt;original&gt; &amp; c/);
  assert.doesNotMatch(svg, /<text[^>]*>[^<]*&(?!amp;|lt;|gt;|quot;)/);
});

test('validação: cena boa não acusa nada', () => {
  assert.deepEqual(validateScene(cena, 'cena.json'), []);
});

test('validação: campos obrigatórios ausentes são nomeados', () => {
  const errs = validateScene({ composition: {} }, 'ruim.json');
  assert.ok(errs.some((e) => e.includes('slide')));
  assert.ok(errs.some((e) => e.includes('concept_reference')));
  assert.ok(errs.some((e) => e.includes('visual_intent')));
  assert.ok(errs.some((e) => e.includes('vazia')));
});

test('validação: seta órfã é erro e diz o que existe na cena', () => {
  const c = { ...cena, actions: [{ arrow: { from: 'left', to: 'inexistente' } }] };
  const errs = validateScene(c, 'x.json');
  assert.ok(errs.some((e) => e.includes('inexistente') && e.includes('Posições')));
});

// A cena tem dois `photo`. Referenciar pelo nome do objeto apontaria a seta
// para um dos dois em silêncio, e o quadro sairia errado sem ninguém notar.
test('validação: referência ambígua por nome de objeto é recusada', () => {
  const c = { ...cena, actions: [{ arrow: { from: 'photo', to: 'copier' } }] };
  const errs = validateScene(c, 'x.json');
  assert.ok(errs.some((e) => e.includes('aparece 2 vezes') && e.includes('nome da posição')));
});

test('referência por nome de objeto vale quando é única na cena', () => {
  const c = { ...cena, actions: [{ arrow: { from: 'left', to: 'copier' } }] };
  assert.deepEqual(validateScene(c, 'x.json'), []);
});

test('validação: posição inventada é erro', () => {
  const c = { ...cena, composition: { meio_da_tela: { object: 'box' } }, actions: [] };
  const errs = validateScene(c, 'x.json');
  assert.ok(errs.some((e) => e.includes('meio_da_tela')));
});

// ── Folha de contato ────────────────────────────────────────────────────────
// A primeira versão punha as opções em colunas paralelas, e ler na horizontal
// fundia as duas histórias numa só. Opção concorrente é alternativa excludente.
import { folhaDeContato } from '../lib/storyboard/sheet.mjs';

const quadroDe = (opcao, slide) => ({
  opcao,
  slide,
  intent: `intenção do quadro ${slide}`,
  annotation: [`legenda do quadro ${slide}`],
  composition: cena.composition,
  concept_reference: { etapa: `etapa-${slide}` },
  svg: renderScene({ ...cena, slide }, `${opcao}/s${slide}`).svg,
});

test('folha: cada opção é um bloco próprio, com "OU" entre elas', () => {
  const h = folhaDeContato([
    quadroDe('option-a-xerox', 1),
    quadroDe('option-a-xerox', 2),
    quadroDe('option-b-telefone', 1),
  ]);
  assert.equal((h.match(/<article class="opcao"/g) || []).length, 2);
  assert.equal((h.match(/class="ou"/g) || []).length, 1, 'um separador entre duas opções');
  assert.doesNotMatch(h, /class="cols"/, 'colunas paralelas fundiam as histórias');
  assert.match(h, /Opção A/);
  assert.match(h, /Opção B/);
});

test('folha: com uma opção só, não há separador nem promessa de escolha', () => {
  const h = folhaDeContato([quadroDe('option-a', 1)]);
  assert.equal((h.match(/class="ou"/g) || []).length, 0);
  assert.doesNotMatch(h, /caminhos diferentes/);
});

test('folha: o painel EXPLICA a cena, não só nomeia a intenção', () => {
  const q = { ...quadroDe('option-a', 1), explicacao: 'O quadro abre com a fonte e o observador separados.' };
  const h = folhaDeContato([q]);
  assert.match(h, /intenção do quadro 1/, 'a intenção é o título do painel');
  assert.match(h, /O quadro abre com a fonte/, 'a explicação é o corpo');
  assert.match(h, /etapa-1/, 'a rastreabilidade fica como nota miúda');
});

test('folha: sem explicacao, o painel cai para a annotation em vez de ficar vazio', () => {
  const h = folhaDeContato([quadroDe('option-a', 1)]);
  assert.match(h, /class="expl"[^>]*>legenda do quadro 1/);
});

test('folha: "em cena" lista objeto, estado e posição com a preposição certa', () => {
  const h = folhaDeContato([quadroDe('option-a', 1)]);
  assert.match(h, /cópia 2 \(degraded 0\.5\) à esquerda/);
  assert.match(h, /ao centro/, '"à centro" seria erro de concordância');
  assert.doesNotMatch(h, /à centro/);
});

// O texto acompanha o centro da cena: alinhado ao topo ele flutuava longe do
// quadro que descreve, que foi o que o autor apontou.
test('folha: o texto é centrado na vertical com a cena', () => {
  const h = folhaDeContato([quadroDe('option-a', 1)]);
  assert.match(h, /\.quadro\{[^}]*align-items:center/);
});

test('folha: option.json declara metáfora, o que representa e o que distorce', () => {
  const h = folhaDeContato([quadroDe('option-a', 1)], {
    'option-a': {
      titulo: 'Xerox da Xerox',
      metafora: 'uma copiadora que copia a própria cópia',
      representa: 'degradação acumulada',
      distorce: 'sugere um operador consciente',
    },
  });
  assert.match(h, /Xerox da Xerox/);
  assert.match(h, /O que distorce/);
  assert.match(h, /sugere um operador consciente/);
});

test('folha: sem option.json, o título sai do nome da pasta', () => {
  const h = folhaDeContato([quadroDe('option-a-telefone-sem-fio', 1)]);
  assert.match(h, /Telefone sem fio/);
});

test('folha: texto do autor é escapado no HTML', () => {
  const h = folhaDeContato([quadroDe('option-a', 1)], {
    'option-a': { titulo: 'A & B <script>' },
  });
  assert.match(h, /A &amp; B &lt;script&gt;/);
  assert.doesNotMatch(h, /<h2>A & B <script>/);
});
