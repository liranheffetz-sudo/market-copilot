type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

export class TTLCache<T> {
  private readonly cache = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number) {}

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, ttlMs = this.ttlMs) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });
  }

  async getOrSet(key: string, loader: () => Promise<T>, ttlMs = this.ttlMs): Promise<T> {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    const value = await loader();
    this.set(key, value, ttlMs);
    return value;
  }
}
