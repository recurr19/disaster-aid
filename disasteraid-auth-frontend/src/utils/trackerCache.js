import { getTrackerStatus } from '../api/tracker';

// Simple in-memory cache for tracker responses
const cache = new Map();
const DEFAULT_TTL = 1000 * 60 * 5; // 5 minutes

export const getCachedTracker = (ticketId) => {
  if (!ticketId) return null;
  const entry = cache.get(ticketId);
  if (!entry) return null;
  if (entry.expires && Date.now() > entry.expires) {
    cache.delete(ticketId);
    return null;
  }
  return entry.data;
};

export const setCachedTracker = (ticketId, data, ttl = DEFAULT_TTL) => {
  if (!ticketId || !data) return;
  cache.set(ticketId, { data, expires: Date.now() + ttl });
};

export const prefetchTracker = async (ticketId) => {
  if (!ticketId) return null;
  try {
    // If already cached, skip
    const existing = getCachedTracker(ticketId);
    if (existing) return existing;
    const res = await getTrackerStatus(ticketId);
    if (res && res.success) {
      setCachedTracker(ticketId, res);
      return res;
    }
  } catch (e) {
    // ignore prefetch errors
    // console.warn('prefetchTracker failed', ticketId, e);
  }
  return null;
};

export const prefetchMany = async (ticketIds = [], opts = { delayMs: 75 }) => {
  if (!Array.isArray(ticketIds)) return;
  const delay = (ms) => new Promise(res => setTimeout(res, ms));
  for (let i = 0; i < ticketIds.length; i++) {
    const t = ticketIds[i];
    // eslint-disable-next-line no-await-in-loop
    await prefetchTracker(t);
    if (opts.delayMs && i < ticketIds.length - 1) await delay(opts.delayMs);
  }
};

export default {
  getCachedTracker,
  setCachedTracker,
  prefetchTracker,
  prefetchMany
};
