type Entry<T> = {
  inFlight?: Promise<T>;
  lastValue?: T;
  lastResolvedAt?: number;
};

const cache = new Map<string, Entry<unknown>>();

export type RunDedupedOptions = {
  /** Minimum time between *successful* executions. If called sooner and we have a cached value, returns cached value. */
  minIntervalMs?: number;
};

/**
 * Global Request Controller
 * - Dedupes concurrent requests by key (single in-flight Promise)
 * - Optionally throttles by returning cached results within minIntervalMs
 */
export async function runDeduped<T>(
  key: string,
  fn: () => Promise<T>,
  options: RunDedupedOptions = {}
): Promise<T> {
  const { minIntervalMs = 0 } = options;
  const now = Date.now();

  const entry = (cache.get(key) as Entry<T> | undefined) ?? {};

  // Throttle: if we have a fresh cached value, use it.
  if (
    minIntervalMs > 0 &&
    entry.lastResolvedAt &&
    entry.lastValue !== undefined &&
    now - entry.lastResolvedAt < minIntervalMs
  ) {
    return entry.lastValue;
  }

  // Dedupe: if a request is already running, share it.
  if (entry.inFlight) {
    return entry.inFlight;
  }

  const promise = fn();
  entry.inFlight = promise;
  cache.set(key, entry as Entry<unknown>);

  try {
    const value = await promise;
    entry.lastValue = value;
    entry.lastResolvedAt = Date.now();
    return value;
  } finally {
    // Always clear inFlight even on error
    const latest = cache.get(key) as Entry<T> | undefined;
    if (latest) {
      delete latest.inFlight;
      cache.set(key, latest as Entry<unknown>);
    }
  }
}

export function clearRunDeduped(keyPrefix?: string) {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) cache.delete(key);
  }
}
