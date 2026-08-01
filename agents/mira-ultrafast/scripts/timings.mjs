import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join } from 'node:path';

export function effectiveSlots(cpuCount = cpus().length) {
  return Math.max(1, Math.min(16, cpuCount - 2));
}

export function readTimings(deckDir) {
  const path = join(deckDir, 'mira', 'fast', 'timings.json');
  if (!existsSync(path)) {
    return { versao: 1, cpus: cpus().length, vagas_efetivas: effectiveSlots(), etapas: [] };
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function appendTiming(deckDir, entry) {
  const value = readTimings(deckDir);
  const inicio = entry.inicio instanceof Date ? entry.inicio.toISOString() : entry.inicio;
  const fim = entry.fim instanceof Date ? entry.fim.toISOString() : entry.fim;
  value.etapas.push({
    ...entry,
    inicio,
    fim,
    duracao_ms: entry.duracao_ms ?? Math.max(0, Date.parse(fim) - Date.parse(inicio)),
  });
  writeFileSync(join(deckDir, 'mira', 'fast', 'timings.json'), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return value;
}

export function summarizeTimings(value) {
  const totals = new Map();
  for (const entry of value.etapas) {
    totals.set(entry.etapa, (totals.get(entry.etapa) ?? 0) + entry.duracao_ms);
  }
  return [...totals].map(([name, duration]) => `${name}=${duration}ms`).join('; ');
}
