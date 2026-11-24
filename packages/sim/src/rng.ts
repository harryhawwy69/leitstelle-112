/**
 * Deterministischer Zufallszahlengenerator für den Simulationskern.
 *
 * Algorithmus: xoshiro128** (32-Bit-Variante), Seeding über SplitMix32.
 * Begründung: schnell, gut verteilt, kleiner Zustand (4 × uint32), der sich trivial
 * serialisieren lässt. Es werden nur Ganzzahl-Operationen verwendet, damit das Ergebnis
 * auf jeder JS-Engine bitgleich ist (ADR-0004).
 */

/** Serialisierbarer Zustand eines Generators. */
export type RngState = readonly [number, number, number, number];

/** SplitMix32: erzeugt aus einem Seed eine Folge gut gemischter 32-Bit-Werte. */
export function splitMix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
}

/** FNV-1a über einen String – leitet stabile Stream-Seeds aus Namen ab. */
export function hashString32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function rotl(x: number, k: number): number {
  return ((x << k) | (x >>> (32 - k))) >>> 0;
}

export class Rng {
  private s0: number;
  private s1: number;
  private s2: number;
  private s3: number;

  private constructor(state: RngState) {
    [this.s0, this.s1, this.s2, this.s3] = state;
    if ((this.s0 | this.s1 | this.s2 | this.s3) === 0) {
      // Der Nullzustand ist ein Fixpunkt von xoshiro und darf nie auftreten.
      this.s0 = 1;
    }
  }

  static fromSeed(seed: number): Rng {
    const next = splitMix32(seed);
    return new Rng([next(), next(), next(), next()]);
  }

  static fromState(state: RngState): Rng {
    return new Rng(state);
  }

  /**
   * Unabhängiger Stream je Subsystem. Der Seed hängt nur vom Master-Seed und vom Namen ab,
   * nicht von der Reihenfolge der Erzeugung – ein neues Subsystem verschiebt die Zufallsfolge
   * der bestehenden nicht.
   */
  static stream(masterSeed: number, name: string): Rng {
    return Rng.fromSeed((masterSeed ^ hashString32(name)) >>> 0);
  }

  state(): RngState {
    return [this.s0, this.s1, this.s2, this.s3];
  }

  /** Gleichverteilte 32-Bit-Ganzzahl ohne Vorzeichen. */
  nextUint32(): number {
    const result = Math.imul(rotl(Math.imul(this.s1, 5) >>> 0, 7), 9) >>> 0;
    const t = (this.s1 << 9) >>> 0;
    this.s2 = (this.s2 ^ this.s0) >>> 0;
    this.s3 = (this.s3 ^ this.s1) >>> 0;
    this.s1 = (this.s1 ^ this.s2) >>> 0;
    this.s0 = (this.s0 ^ this.s3) >>> 0;
    this.s2 = (this.s2 ^ t) >>> 0;
    this.s3 = rotl(this.s3, 11);
    return result;
  }

  /** Gleichverteilte Zahl im Intervall [0, 1) mit 32 Bit Auflösung. */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /**
   * Gleichverteilte Ganzzahl im geschlossenen Intervall [min, max].
   * Verwendet Rejection Sampling, damit keine Modulo-Verzerrung entsteht.
   */
  nextInt(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Ungültiges Intervall [${min}, ${max}]`);
    }
    const range = max - min + 1;
    if (range > 4294967296) {
      throw new RangeError('Intervall größer als 2^32 wird nicht unterstützt');
    }
    const limit = 4294967296 - (4294967296 % range);
    let x = this.nextUint32();
    while (x >= limit) {
      x = this.nextUint32();
    }
    return min + (x % range);
  }

  /** true mit Wahrscheinlichkeit p (0 ≤ p ≤ 1). */
  chance(p: number): boolean {
    if (p <= 0) return false;
    if (p >= 1) return true;
    return this.nextFloat() < p;
  }

  /** Wählt ein Element gleichverteilt aus einer nicht leeren Liste. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError('pick() auf leerer Liste');
    }
    return items[this.nextInt(0, items.length - 1)] as T;
  }
}
