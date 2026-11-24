/**
 * Stabile Prüfsumme über JSON-artige Werte (Determinismus-Tests, Golden-Replays).
 * Objektschlüssel werden sortiert, damit die Einfügereihenfolge keinen Einfluss hat.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new TypeError('Nicht-endliche Zahl im Zustand');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const v = (value as Record<string, unknown>)[key];
    if (v === undefined) continue;
    parts.push(`${JSON.stringify(key)}:${canonicalJson(v)}`);
  }
  return `{${parts.join(',')}}`;
}

/**
 * Zwei gekoppelte 32-Bit-FNV-1a-Varianten über den kanonischen JSON-Text (zusammen 64 Bit),
 * als 16-stelliger Hex-String. Kein kryptografischer Hash – nur für Gleichheitsprüfungen.
 */
export function hashValue(value: unknown): string {
  const text = canonicalJson(value);
  // Zwei 32-Bit-Hälften, weil JS keine 64-Bit-Ganzzahlmultiplikation ohne BigInt hat.
  let h1 = 0x811c9dc5;
  let h2 = 0xcbf29ce4;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c ^ (h1 >>> 7), 0x01000193) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}
