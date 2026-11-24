import type { SimTime } from './time';

/** Eintrag der Ereigniswarteschlange: fester Zeitpunkt plus stabile Sequenznummer. */
export interface Scheduled<T> {
  readonly at: SimTime;
  readonly seq: number;
  readonly payload: T;
}

function before<T>(a: Scheduled<T>, b: Scheduled<T>): boolean {
  return a.at < b.at || (a.at === b.at && a.seq < b.seq);
}

/**
 * Binärer Min-Heap nach (Zeitpunkt, Sequenznummer).
 * Gleichzeitige Ereignisse werden in Einfügereihenfolge abgearbeitet – das ist für den
 * Determinismus entscheidend (ADR-0004).
 */
export class EventQueue<T> {
  private heap: Scheduled<T>[] = [];
  private nextSeq = 0;

  get size(): number {
    return this.heap.length;
  }

  schedule(at: SimTime, payload: T): Scheduled<T> {
    const entry: Scheduled<T> = { at, seq: this.nextSeq++, payload };
    this.heap.push(entry);
    this.siftUp(this.heap.length - 1);
    return entry;
  }

  peek(): Scheduled<T> | undefined {
    return this.heap[0];
  }

  /** Entnimmt das früheste Ereignis, falls es spätestens zum Zeitpunkt `until` fällig ist. */
  popDue(until: SimTime): Scheduled<T> | undefined {
    const top = this.heap[0];
    if (top === undefined || top.at > until) return undefined;
    const last = this.heap.pop() as Scheduled<T>;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  /** Serialisierbare Form, sortiert – unabhängig vom inneren Heap-Layout. */
  toJSON(): { nextSeq: number; entries: Scheduled<T>[] } {
    const entries = [...this.heap].sort((a, b) => (before(a, b) ? -1 : 1));
    return { nextSeq: this.nextSeq, entries };
  }

  static fromJSON<T>(data: { nextSeq: number; entries: readonly Scheduled<T>[] }): EventQueue<T> {
    const q = new EventQueue<T>();
    for (const e of data.entries) {
      q.heap.push(e);
      q.siftUp(q.heap.length - 1);
    }
    q.nextSeq = data.nextSeq;
    return q;
  }

  private siftUp(index: number): void {
    let i = index;
    const h = this.heap;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      const child = h[i] as Scheduled<T>;
      const par = h[parent] as Scheduled<T>;
      if (!before(child, par)) break;
      h[i] = par;
      h[parent] = child;
      i = parent;
    }
  }

  private siftDown(index: number): void {
    let i = index;
    const h = this.heap;
    const n = h.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = l + 1;
      let smallest = i;
      if (l < n && before(h[l] as Scheduled<T>, h[smallest] as Scheduled<T>)) smallest = l;
      if (r < n && before(h[r] as Scheduled<T>, h[smallest] as Scheduled<T>)) smallest = r;
      if (smallest === i) return;
      const tmp = h[i] as Scheduled<T>;
      h[i] = h[smallest] as Scheduled<T>;
      h[smallest] = tmp;
      i = smallest;
    }
  }
}
