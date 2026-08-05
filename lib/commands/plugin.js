import { join, resolve, basename } from 'path';
import { existsSync, mkdtempSync, rmSync, cpSync, mkdirSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { execFileSync } from 'child_process';
import {
  PLUGINS_DIR, syncPlugins, inspectPlugins, validatePlugin, listPluginFolders,
} from '../runtime/plugin-sync.js';

const LARANJA = '#FF904D';

/* Contexto de validação do projeto: sem ele, `validate`, `pack` e `add`
   aprovariam plugin que a sincronização depois recusa, que é o pior tipo de
   divergência para quem está do outro lado. */
function ctxDoProjeto(projectRoot) {
  let state = {};
  try { state = JSON.parse(readFileSync(join(projectRoot, '.mira', 'state.json'), 'utf8')); } catch { /* ignora */ }
  return {
    nativeAgents: new Set(Array.isArray(state.agents) ? state.agents : []),
    miraVersion: state.version,
  };
}

function temTar() {
  try {
    execFileSync('tar', ['--version'], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function avisoSpecs(chalk) {
  console.log(chalk.yellow('\n  As specs deste plugin NÃO entram no pacote.'));
  console.log(chalk.gray('  Elas ficam em _reversa_sdd/ e _reversa_forward/, na sua máquina.'));
  console.log(chalk.gray('  Quem receber o plugin recebe ele funcionando, mas não consegue'));
  console.log(chalk.gray('  evoluí-lo com Reversa a partir das specs. Guarde essas pastas.'));
}

function avisoEnginesSemGancho(chalk, visao) {
  if (!visao.enginesWithoutHook?.length) return;
  if (visao.hasSessionHook) {
    console.log(chalk.gray(`\n  Nota: ${visao.enginesWithoutHook.join(', ')} não têm gancho de início de sessão,`));
    console.log(chalk.gray('  mas são sincronizadas junto quando uma engine que tem o gancho abre sessão.'));
    return;
  }
  console.log(chalk.yellow(`\n  Nenhuma engine instalada (${visao.enginesWithoutHook.join(', ')}) tem gancho de início de sessão.`));
  console.log(chalk.gray('  Rode "npx mira-animator plugin sync" depois de colocar ou apagar uma pasta de plugin.'));
}

function relatorio(chalk, r) {
  if (r.activated.length) console.log(chalk.hex(LARANJA)('  ✔') + `  ativado(s): ${r.activated.join(', ')}`);
  if (r.deactivated.length) console.log(chalk.hex(LARANJA)('  ✔') + `  removido(s): ${r.deactivated.join(', ')}`);
  for (const item of r.rejected) {
    console.log(chalk.red('  ✖') + `  ${item.id}: ${item.code}`);
    console.log(chalk.gray(`      ${item.file}${item.detail ? ` (${item.detail})` : ''}`));
  }
  if (!r.activated.length && !r.deactivated.length && !r.rejected.length) {
    console.log(chalk.gray('  Nada a sincronizar.'));
  }
}

async function cmdList(projectRoot, chalk) {
  const visao = inspectPlugins(projectRoot);
  if (!visao.installed) {
    console.error('\n  O Mira não está instalado nesta pasta. Execute "npx mira-animator install".\n');
    process.exit(1);
  }

  console.log(chalk.bold('\n  Plugins'));
  if (!visao.active.length && !visao.rejected.length) {
    console.log(chalk.gray(`\n  Nenhum plugin em ${PLUGINS_DIR}/.`));
    console.log(chalk.gray('  Crie um com /mira-new-plugin ou instale um com "plugin add <arquivo>".'));
  }

  for (const p of visao.active) {
    const marca = p.activated ? chalk.hex(LARANJA)('●') : chalk.gray('○');
    console.log(`\n  ${marca} ${chalk.bold(p.id)}  v${p.version}  ${chalk.gray(p.author)}  [${p.tier}]`);
    if (p.description) console.log(chalk.gray(`      ${p.description}`));
    if (!p.activated) console.log(chalk.gray('      ainda não ativado, rode "plugin sync"'));
  }

  for (const item of visao.rejected) {
    console.log(`\n  ${chalk.red('✖')} ${chalk.bold(item.id)}  ${chalk.red(item.code)}`);
    console.log(chalk.gray(`      ${item.file}${item.detail ? ` (${item.detail})` : ''}`));
  }

  avisoEnginesSemGancho(chalk, visao);
  console.log('');
}

async function cmdSync(projectRoot, chalk) {
  console.log(chalk.bold('\n  Sincronizando plugins'));
  const r = syncPlugins(projectRoot);
  relatorio(chalk, r);
  avisoEnginesSemGancho(chalk, r);
  console.log('');
}

async function cmdValidate(projectRoot, chalk, alvo) {
  const ids = alvo ? [alvo] : listPluginFolders(projectRoot);
  if (!ids.length) {
    console.log(chalk.gray(`\n  Nenhum plugin em ${PLUGINS_DIR}/.\n`));
    return;
  }

  const ctx = ctxDoProjeto(projectRoot);
  let falhas = 0;

  console.log(chalk.bold('\n  Validação'));
  for (const id of ids) {
    const veredito = validatePlugin(projectRoot, id, ctx);
    if (veredito.ok) {
      console.log(chalk.hex(LARANJA)('  ✔') + `  ${id}  v${veredito.manifest.version}`);
    } else {
      falhas++;
      console.log(chalk.red('  ✖') + `  ${id}: ${veredito.code}`);
      console.log(chalk.gray(`      ${veredito.file}${veredito.detail ? ` (${veredito.detail})` : ''}`));
    }
  }
  console.log('');
  if (falhas) process.exitCode = 1;
}

async function cmdPack(projectRoot, chalk, id) {
  if (!id) {
    console.error('\n  Uso: npx mira-animator plugin pack <id>\n');
    process.exit(1);
  }
  if (!temTar()) {
    console.error('\n  TAR_UNAVAILABLE: o "tar" do sistema não está disponível.');
    console.error('  Contorno: envie a pasta mira-plugins/' + id + ' e o receptor a coloca em mira-plugins/.\n');
    process.exit(1);
  }

  const veredito = validatePlugin(projectRoot, id, ctxDoProjeto(projectRoot));
  if (!veredito.ok) {
    console.error(`\n  ${veredito.code}: ${veredito.file}${veredito.detail ? ` (${veredito.detail})` : ''}`);
    console.error('  Corrija o plugin antes de empacotar.\n');
    process.exit(1);
  }

  // Só nomes relativos, com o cwd no lugar certo: o GNU tar interpreta um
  // caminho com letra de unidade ("C:\...") como host remoto e falha.
  const nome = `${id}-${veredito.manifest.version}.mplug`;
  const base = join(projectRoot, PLUGINS_DIR);
  const saida = join(base, nome);
  try {
    execFileSync('tar', ['-czf', nome, id], { cwd: base, stdio: 'pipe' });
  } catch (erro) {
    rmSync(saida, { force: true });
    console.error(`\n  PACK_FAILED: ${String(erro.stderr || erro.message).trim()}\n`);
    process.exit(1);
  }

  console.log(chalk.hex(LARANJA)('\n  ✔') + `  ${basename(saida)}`);
  console.log(chalk.gray(`  ${saida}`));
  avisoSpecs(chalk);
  console.log('');
}

async function cmdAdd(projectRoot, chalk, arquivo) {
  if (!arquivo) {
    console.error('\n  Uso: npx mira-animator plugin add <arquivo.mplug>\n');
    process.exit(1);
  }
  const pacote = resolve(arquivo);
  if (!existsSync(pacote)) {
    console.error(`\n  PKG_NOT_FOUND: ${pacote}\n`);
    process.exit(1);
  }
  if (!temTar()) {
    console.error('\n  TAR_UNAVAILABLE: o "tar" do sistema não está disponível.');
    console.error('  Contorno: descompacte o pacote à mão dentro de mira-plugins/.\n');
    process.exit(1);
  }

  const temp = mkdtempSync(join(tmpdir(), 'mira-mplug-'));
  // `process.exit` não desenrola a pilha, então o `finally` não rodaria e a
  // área temporária vazaria. Aqui todo caminho de erro sai por `return`.
  const erro = (mensagem) => { console.error(`\n  ${mensagem}\n`); process.exitCode = 1; };

  try {
    // O pacote é copiado para a área temporária e o tar roda ali com nome
    // relativo: caminho com letra de unidade quebra o GNU tar.
    const local = 'pacote.mplug';
    cpSync(pacote, join(temp, local), { force: true });

    let conteudo;
    try {
      conteudo = execFileSync('tar', ['-tzf', local], { cwd: temp, encoding: 'utf8' })
        .split('\n').map(l => l.trim()).filter(Boolean);
    } catch {
      return erro(`PKG_INVALID: ${pacote}`);
    }

    if (conteudo.some(e => e.startsWith('/') || /^[a-zA-Z]:/.test(e) || e.split('/').includes('..'))) {
      return erro('PKG_ESCAPE: o pacote tenta escrever fora do destino.');
    }

    const raizes = [...new Set(conteudo.map(e => e.split('/')[0]))];
    if (raizes.length !== 1) return erro(`PKG_MULTIPLE_ROOTS: ${raizes.join(', ')}`);
    const id = raizes[0];

    // Extrai dentro de `<temp>/mira-plugins/` para que a validação enxergue o
    // mesmo layout de um projeto de verdade.
    const casa = join(temp, PLUGINS_DIR);
    mkdirSync(casa, { recursive: true });
    execFileSync('tar', ['-xzf', `../${local}`], { cwd: casa, stdio: 'pipe' });

    // Valida na área temporária, com o contexto do projeto de destino: nada é
    // escrito antes disso, e o veredito é o mesmo que a sincronização daria.
    const veredito = validatePlugin(temp, id, ctxDoProjeto(projectRoot));
    if (!veredito.ok) {
      // Do ponto de vista do pacote, id divergente é raiz errada no arquivo.
      const codigo = veredito.code === 'ID_MISMATCH' ? 'PKG_ROOT_MISMATCH' : veredito.code;
      return erro(`${codigo}: ${veredito.file}${veredito.detail ? ` (${veredito.detail})` : ''}`);
    }

    // Inventário à vista ANTES de qualquer escrita no projeto.
    console.log(chalk.bold('\n  Conteúdo do pacote'));
    console.log(`  ${chalk.bold(id)}  v${veredito.manifest.version}  ${chalk.gray(veredito.manifest.author)}  [${veredito.manifest.tier}]`);
    if (veredito.manifest.description) console.log(chalk.gray(`  ${veredito.manifest.description}`));
    console.log('');
    for (const entrada of conteudo) console.log(chalk.gray(`    ${entrada}`));
    console.log(chalk.gray('\n  Nenhum script deste pacote é executado na instalação.'));

    const destino = join(projectRoot, PLUGINS_DIR, id);
    const { default: inquirer } = await import('inquirer');
    if (existsSync(destino)) {
      const { substituir } = await inquirer.prompt([{
        prefix: '', type: 'confirm', name: 'substituir',
        message: `\nJá existe mira-plugins/${id}. Substituir?`, default: false,
      }]);
      if (!substituir) {
        console.log(chalk.gray('\n  PKG_EXISTS: instalação cancelada.\n'));
        return;
      }
      rmSync(destino, { recursive: true, force: true });
    } else {
      const { seguir } = await inquirer.prompt([{
        prefix: '', type: 'confirm', name: 'seguir',
        message: '\nInstalar este plugin?', default: true,
      }]);
      if (!seguir) {
        console.log(chalk.gray('\n  Instalação cancelada.\n'));
        return;
      }
    }

    mkdirSync(join(projectRoot, PLUGINS_DIR), { recursive: true });
    cpSync(join(casa, id), destino, { recursive: true, force: true });
    console.log(chalk.hex(LARANJA)('\n  ✔') + `  ${PLUGINS_DIR}/${id}`);

    const r = syncPlugins(projectRoot);
    relatorio(chalk, r);
    console.log(chalk.gray('\n  O comando aparece na próxima sessão do seu agente.\n'));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}

const SUB = {
  list: cmdList,
  sync: cmdSync,
  validate: cmdValidate,
  pack: cmdPack,
  add: cmdAdd,
};

export default async function plugin(args = []) {
  const { default: chalk } = await import('chalk');
  const projectRoot = resolve(process.cwd());
  const [sub, alvo] = args;

  if (!sub || sub === '--help' || sub === '-h') {
    console.log(`
  Uso: npx mira-animator plugin <subcomando>

    list                 Lista os plugins de ${PLUGINS_DIR}/ e o estado de cada um
    sync                 Ativa o que apareceu e remove o que sumiu, sem esperar a sessão
    validate [<id>]      Valida um plugin, ou todos se nenhum for informado
    pack <id>            Gera ${PLUGINS_DIR}/<id>-<versao>.mplug para compartilhar
    add <arquivo>        Instala um plugin a partir de um .mplug

  Instalar também é só colocar a pasta em ${PLUGINS_DIR}/.
  Desinstalar é apagar a pasta: o Mira limpa a cópia ativada sozinho.
`);
    return;
  }

  const fn = SUB[sub];
  if (!fn) {
    console.error(`\n  Subcomando desconhecido: "${sub}"`);
    console.error('  Execute "npx mira-animator plugin --help".\n');
    process.exit(1);
  }

  if (!existsSync(join(projectRoot, '.mira', 'state.json'))) {
    console.error('\n  O Mira não está instalado nesta pasta. Execute "npx mira-animator install".\n');
    process.exit(1);
  }

  await fn(projectRoot, chalk, alvo);
}
