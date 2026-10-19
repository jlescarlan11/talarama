/** Per-process bounded metadata cache; no personal/member state belongs here. Failed loads are never retained. */
export class MetadataCache {
  private entries = new Map<string, { expires: number; value: Promise<unknown> }>();
  constructor(private readonly capacity = 200, private readonly now = Date.now) {}
  get<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
    const existing = this.entries.get(key);
    if (existing && existing.expires > this.now()) return existing.value as Promise<T>;
    this.entries.delete(key);
    while (this.entries.size >= this.capacity) this.entries.delete(this.entries.keys().next().value!);
    const entry = { expires: Infinity, value: Promise.resolve().then(load) as Promise<unknown> };
    this.entries.set(key, entry);
    entry.value = entry.value.then(value => {
      entry.expires = this.now() + ttlMs;
      return value;
    }, error => {
      if (this.entries.get(key) === entry) this.entries.delete(key);
      throw error;
    });
    return entry.value as Promise<T>;
  }
}
