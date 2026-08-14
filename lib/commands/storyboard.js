/**
 * `mira storyboard <sub>`
 *
 *   render <pasta>   cenas .json → .svg + .png + folha de contato
 *   verify <deck>    o conceito aprovado atravessou a cadeia até o slide?
 *
 * O `render` desenha. O `verify` NÃO desenha e NÃO corrige: só relata.
 * Verificador que altera arquivo vira risco, e corrigir é decisão do autor.
 */
import path from 'node:path';
import chalk from 'chalk';
import { build } from '../storyboard/build.mjs';
import { verify, formatarRelatorio } from '../storyboard/verify.mjs';

const USO = `
  Uso: npx mira-animator storyboard <sub>

    render <pasta>   Gera .svg e .png de cada cena .json, mais a folha de contato.
                     Opção: --no-png  (só o vetor, sem rasterizar)
                     A pasta é a storyboard/ na raiz de um deck.

    verify <deck>    Confere se o conceito aprovado chegou nos slides.
                     Só relata, nunca corrige. Sai com 0 quando confere.
`;

export default async function storyboard(args) {
  const sub = args[0];
  const alvo = args[1];

  if (!sub || sub === '--help' || sub === '-h') {
    console.log(USO);
    process.exit(0);
  }

  if (!alvo) {
    console.error(chalk.red(`Falta o caminho. ${USO}`));
    process.exit(2);
  }

  const raiz = path.resolve(alvo);

  if (sub === 'render') {
    const png = !args.includes('--no-png');
    try {
      const r = await build(raiz, { png });
      console.log(
        `cenas: ${chalk.bold(r.cenas)} | svg: ${chalk.bold(r.svg.length)} | png: ${chalk.bold(r.png.length)}`
      );
      if (r.desconhecidos.length) {
        console.log(chalk.yellow('objetos sem primitiva: ') + r.desconhecidos.join(', '));
      }
      r.avisos.forEach((a) => console.log(chalk.yellow('aviso: ') + a));
      r.pngFalhou.forEach((a) => console.log(chalk.yellow('png: ') + a));
      r.erros.forEach((e) => console.log(chalk.red('ERRO: ') + e));
      if (r.folha) console.log('folha de contato: ' + chalk.cyan(r.folha));
      else console.log(chalk.yellow('nenhuma cena .json encontrada em ') + raiz);
      process.exit(r.erros.length ? 1 : 0);
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(1);
    }
  }

  if (sub === 'verify') {
    try {
      const r = verify(raiz);
      console.log(formatarRelatorio(r));
      process.exit(r.conforme ? 0 : 1);
    } catch (e) {
      console.error(chalk.red(e.message));
      process.exit(2);
    }
  }

  console.error(chalk.red(`Subcomando desconhecido: ${sub}` + USO));
  process.exit(2);
}
