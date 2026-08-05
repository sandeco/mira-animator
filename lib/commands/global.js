import { globalStatus, installGlobal } from '../global/installation.js';

export default async function global(args = []) {
  const [operation] = args;
  if (!['install', 'update', 'status'].includes(operation)) {
    console.error('\n  Uso: mira global <install|update|status>\n');
    process.exitCode = 1;
    return;
  }

  if (operation === 'status') {
    const status = globalStatus();
    if (!status.exists) {
      console.log('\n  Instalação global do Mira não encontrada.\n');
      return;
    }
    console.log(`\n  Instalação global: ${status.path}`);
    console.log(`  Versão instalada: ${status.installedVersion}`);
    console.log(`  Versão em execução: ${status.packageVersion}`);
    console.log(`  Integridade: ${status.corrupted ? 'CORROMPIDA' : 'válida'} (agents: ${status.agents ? 'ok' : 'ausente'}, templates: ${status.templates ? 'ok' : 'ausente'})\n`);
    if (status.corrupted) process.exitCode = 1;
    return;
  }

  const result = installGlobal({ operation });
  console.log(`\n  Mira global ${operation === 'install' ? 'instalado' : 'atualizado'} em: ${result.path}`);
  console.log(`  Versão: ${result.version}\n`);
}
