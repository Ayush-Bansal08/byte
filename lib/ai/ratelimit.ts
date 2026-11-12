/**
 * In-memory limits: a per-visitor sliding window plus a per-instance daily budget.
 * On serverless hosts each instance keeps its own counters, so these are a guard
 * rail, not a billing guarantee; set a hard spend limit in the provider console too.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();
  private day = '';
  private dayCount = 0;

  constructor(
    private perWindow: number,
    private windowMs: number,
    private dailyLimit: number,
    private now: () => number = Date.now,
  ) {}

  check(key: string): { ok: true } | { ok: false; reason: 'visitor' | 'daily'; retryAfter: number } {
    const t = this.now();
    const list = (this.hits.get(key) ?? []).filter((x) => t - x < this.windowMs);
    if (list.length >= this.perWindow) {
      this.hits.set(key, list);
      return { ok: false, reason: 'visitor', retryAfter: Math.ceil((this.windowMs - (t - list[0]!)) / 1000) };
    }
    list.push(t);
    this.hits.set(key, list);
    if (this.hits.size > 5000) this.prune(t);
    return { ok: true };
  }

  /** Counts model calls only; offline answers are free. */
  takeDaily(): boolean {
    const d = new Date(this.now()).toISOString().slice(0, 10);
    if (d !== this.day) {
      this.day = d;
      this.dayCount = 0;
    }
    if (this.dayCount >= this.dailyLimit) return false;
    this.dayCount++;
    return true;
  }

  private prune(t: number) {
    for (const [k, v] of this.hits) if (!v.some((x) => t - x < this.windowMs)) this.hits.delete(k);
  }
}
