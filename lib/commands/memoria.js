import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { MEMORY_DIR, NOTAS_DIR, ESTADOS, lerNotas, selecionar, formatarPacote, criarNota, atualizarNota } from '../memoria/notas.js';
import { consolidar } from '../memoria/consolidacao.js';

/*
  npx mira-animator memoria <subcomando>

    lembrancas [--papel capa] [--formato 16x9] [--tema mira-dark] [--eixo cor]
               [--registro <arquivo.md>]
        Imprime o pacote legível de lembranças que se aplicam à situação.
        É o que o builder lê antes de gerar um slide. Com --registro, apenda
        o pacote (aplicadas e ignoradas) num arquivo de proveniência.

    nota "<frase>" --eixo <eixo> [--papel capa] [--formato 9x16]
        Grava uma ordem explícita do usuário como preferência ATIVA na hora.

    consolidar [--simular]
        Lê o log de evidência e cria notas CANDIDATAS do que já se repetiu
        o bastante (3 episódios, 3 decks, 2 sessões). Candidata não é
        aplicada até você ativar.

    estado <arquivo.md> <ativo|suspenso|revogado|candidato|observado>
        Ativa, suspende ou revoga uma nota. Reversão é estado, nunca delete.

    listar
        Todas as notas com estado, escopo e reforços.

    onde
        Caminho da pasta de memória e tamanho do log de evidência.

  A pasta é MIRA_MEMORY_DIR ou ~/.mira-memory. Fora do deck, sempre.
*/

/* separa --flag valor de argumento solto; o valor de uma flag nunca
   volta como solto (senão a frase da nota pegaria "capa" de --papel) */
function parseArgs(args) {
    const flags = {}, soltos = [];
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (!a.startsWith('--')) { soltos.push(a); continue; }
        const igual = a.indexOf('=');
        if (igual !== -1) flags[a.slice(2, igual)] = a.slice(igual + 1);
        else if (args[i + 1] && !args[i + 1].startsWith('--')) flags[a.slice(2)] = args[++i];
        else flags[a.slice(2)] = 'true';
    }
    return { flags, soltos };
}

function contextoDe(f) {
    return {
        eixo: f.eixo, papel: f.papel, tipo_slide: f.tipo_slide || f.tipo,
        tema: f.tema, formato: f.formato, relacao_texto_imagem: f.relacao_texto_imagem
    };
}

function avisar(avisos) {
    for (const a of avisos) console.error('  aviso: ' + a);
}

export default async function memoria(args) {
    const { flags: f, soltos } = parseArgs(args);
    const sub = soltos[0] || 'lembrancas';

    if (sub === 'lembrancas') {
        const { notas, avisos } = lerNotas();
        avisar(avisos);
        const contexto = contextoDe(f);
        const pacote = formatarPacote(selecionar(notas, contexto, { teto: Number(f.teto) || 6 }), contexto);
        console.log(pacote);
        /* proveniência (recuperacao-aplicacao RF-09): o que foi aplicado,
           o que foi ignorado e por quê tem que sobreviver à geração, senão
           some da tela e ninguém audita depois.

           Mora em MIRA_MEMORY_DIR/proveniencia/, NUNCA dentro do deck: o
           pacote contém o perfil do usuário em texto puro e o deck é
           drop-and-run, subiria junto para o servidor. É a mesma razão do
           evidencia.jsonl ficar fora (RF-08). `--registro` aceita só um
           nome, não um caminho. */
        if (f.registro) {
            const nome = String(f.registro).replace(/[^\w.-]+/g, '-').replace(/\.md$/i, '') || 'deck';
            const destino = join(MEMORY_DIR, 'proveniencia', nome + '.md');
            mkdirSync(dirname(destino), { recursive: true });
            const anterior = existsSync(destino) ? readFileSync(destino, 'utf8').trimEnd() + '\n\n' : '';
            /* cabeçalho com hora: deck regerado acumula blocos, e sem isso
               não dá para saber qual bloco é de qual build */
            const carimbo = '<!-- ' + new Date().toISOString() + ' -->\n';
            writeFileSync(destino, anterior + carimbo + pacote + '\n', 'utf8');
            console.log('\n  proveniência registrada em ' + destino);
        }
        return;
    }

    if (sub === 'nota') {
        const texto = soltos.slice(1).join(' ');
        if (!texto) {
            console.error('\n  Falta a frase. Ex.: npx mira-animator memoria nota "na capa o título fica na metade de cima" --eixo posicao --papel capa\n');
            process.exit(1);
        }
        try {
            const { arquivo, caminho, estado } = criarNota({
                texto,
                eixo: f.eixo || 'indefinido',
                escopo: {
                    papel: f.papel, tipo_slide: f.tipo_slide || f.tipo,
                    tema: f.tema, formato: f.formato, relacao_texto_imagem: f.relacao_texto_imagem
                },
                fonte: 'ordem'
            });
            console.log('\n  nota gravada (' + estado + '): ' + arquivo);
            console.log('  ' + caminho + '\n');
        } catch (e) {
            console.error('\n  ' + e.message + '\n');
            process.exit(1);
        }
        return;
    }

    if (sub === 'listar') {
        const { notas, avisos } = lerNotas();
        avisar(avisos);
        if (!notas.length) { console.log('\n  Nenhuma nota ainda em ' + NOTAS_DIR + '\n'); return; }
        console.log('');
        for (const n of notas) {
            const escopo = Object.entries(n.escopo).map(([k, v]) => k + '=' + v).join(', ') || 'geral';
            console.log('  [' + n.estado + '] ' + n.eixo + ' (' + escopo + ')  ×' + n.reforcos);
            console.log('      ' + n.texto.split(/\r?\n/)[0]);
            console.log('      ' + n.arquivo);
        }
        console.log('');
        return;
    }

    if (sub === 'consolidar') {
        const simular = f.simular === 'true' || f.simular === '' || soltos.includes('--simular');
        const r = consolidar({ simular });
        for (const e of r.erros) console.error('  aviso: ' + e);
        console.log('\n  ' + r.fichas + ' ficha(s) de evidência lidas' + (simular ? '  (simulação, nada gravado)' : ''));
        if (r.criadas.length) {
            console.log('\n  notas candidatas' + (simular ? ' que seriam criadas' : ' criadas') + ':');
            for (const n of r.criadas) {
                const escopo = n.escopo.papel ? 'papel=' + n.escopo.papel : 'geral';
                console.log('    [candidato] ' + n.eixo + ' (' + escopo + ') ×' + n.reforcos + '  ' + n.arquivo);
                console.log('      ' + n.texto);
            }
            console.log('\n  candidata NÃO é aplicada. Revise e ative com:');
            console.log('    npx mira-animator memoria estado <arquivo> ativo');
        }
        if (r.reforcadas.length) {
            console.log('\n  notas reforçadas:');
            for (const n of r.reforcadas) console.log('    ' + n.arquivo + ' → ×' + n.episodios);
        }
        if (r.recusadas.length) {
            console.log('\n  padrões ainda abaixo do limiar:');
            for (const n of r.recusadas) {
                const escopo = n.escopo.papel ? 'papel=' + n.escopo.papel : 'geral';
                console.log('    ' + n.eixo + '/' + n.classe + ' (' + escopo + '): ' + n.motivo.join('; '));
            }
        }
        if (!r.criadas.length && !r.reforcadas.length && !r.recusadas.length) {
            console.log('  Nenhum padrão ainda. Continue editando; a memória enche sozinha.');
        }
        console.log('');
        return;
    }

    if (sub === 'estado') {
        const arquivo = soltos[1], estado = soltos[2];
        if (!arquivo || !estado) {
            console.error('\n  Uso: npx mira-animator memoria estado <arquivo.md> <' + ESTADOS.join('|') + '>\n');
            process.exit(1);
        }
        try {
            const r = atualizarNota(arquivo, { estado });
            console.log('\n  ' + r.arquivo + ' → ' + r.estado + '\n');
        } catch (e) {
            console.error('\n  ' + e.message + '\n');
            process.exit(1);
        }
        return;
    }

    if (sub === 'onde') {
        const log = join(MEMORY_DIR, 'evidencia.jsonl');
        const linhas = existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).length : 0;
        console.log('\n  memória:   ' + MEMORY_DIR);
        console.log('  notas:     ' + NOTAS_DIR + (existsSync(NOTAS_DIR) ? '' : '  (ainda não existe)'));
        console.log('  evidência: ' + log + '  (' + linhas + ' linha(s))\n');
        return;
    }

    console.error('\n  Subcomando desconhecido: "' + sub + '"');
    console.error('  Use: lembrancas | nota | consolidar | estado | listar | onde\n');
    process.exit(1);
}
