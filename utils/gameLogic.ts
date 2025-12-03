import { TRANSIT_SYSTEMS } from '../data/data';
import { TransitSystem, TransitRegion } from '../types';

export const getRandomSystem = (
  excludeNames: string[] = [],
  region: TransitRegion = 'Any',
): TransitSystem => {
  const pool = region === 'Any' ? TRANSIT_SYSTEMS : TRANSIT_SYSTEMS.filter((i) => i.region === region);

  const eligible = pool.filter((system) => !excludeNames.includes(system.name));
  const source = eligible.length > 0 ? eligible : pool;
  return source[Math.floor(Math.random() * source.length)];
};

export const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['".,\\-\\/()]/g, '')
    .replace(/\b(the|system|transit|transportation|authority|metro|subway|rail|railway|transport)\b/g, '')
    .replace(/\s+/g, '')
    .trim();
};

export const checkGuess = (guess: string, system: TransitSystem): boolean => {
  const normalizedGuess = normalizeString(guess);
  const normalizedActual = normalizeString(system.name);
  const normalizedAliases = (system.aliases ?? []).map((alias) => normalizeString(alias));

  if (!normalizedGuess) return false;
  return normalizedGuess === normalizedActual || normalizedAliases.includes(normalizedGuess);
};

export const findSystemByName = (name: string): TransitSystem | undefined => {
  const target = normalizeString(name);
  return TRANSIT_SYSTEMS.find(
    (system) =>
      normalizeString(system.name) === target ||
      (system.aliases ?? []).some((alias) => normalizeString(alias) === target),
  );
};
