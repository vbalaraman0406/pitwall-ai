import axios from 'axios';

const api = axios.create({
  baseURL: '/f1/api',
  timeout: 120000, // 2 min for cold starts
});

// ──── In-memory response cache ────
const _cache: Record<string, { data: any; ts: number }> = {};

/**
 * Cache-first with stale-while-revalidate strategy.
 * Returns cached data immediately if available (even if stale),
 * and refreshes in the background if cache is older than ttlMs.
 */
function cachedGet(key: string, fetcher: () => Promise<any>, ttlMs: number = 300000) {
  const cached = _cache[key];
  if (cached) {
    // If fresh, just return cached
    if (Date.now() - cached.ts < ttlMs) {
      return Promise.resolve(cached.data);
    }
    // If stale, return cached immediately BUT refresh in background
    fetcher().then(data => {
      _cache[key] = { data, ts: Date.now() };
    }).catch(() => {});
    return Promise.resolve(cached.data);
  }
  // No cache at all — must wait for fetch
  return fetcher().then(data => {
    _cache[key] = { data, ts: Date.now() };
    return data;
  });
}

// --- Race endpoints ---
export const getRaceSchedule = (year) =>
  cachedGet(`schedule_${year}`, async () => {
    const response = await api.get(`/race/schedule/${year}`);
    return response.data;
  }, 7200000).catch(() => []);  // 2 hours — schedule rarely changes

export const getRaceResults = (year, round) =>
  cachedGet(`results_${year}_${round}`, async () => {
    const response = await api.get(`/race/${year}/${round}/results`);
    return response.data;
  }, 7200000).catch(() => ({ results: [] }));  // 2 hours — past results don't change

export const getRaceLaps = async (year, round) => {
  try {
    const response = await api.get(`/race/${year}/${round}/laps`);
    return response.data;
  } catch (error) {
    console.error('Error fetching race laps:', error);
    return { laps: [] };
  }
};

export const getRaceStrategy = async (year, round) => {
  try {
    const response = await api.get(`/race/${year}/${round}/strategy`);
    return response.data;
  } catch (error) {
    console.error('Error fetching tire strategy:', error);
    return { strategies: [] };
  }
};

export const getQualifyingResults = (year, round) =>
  cachedGet(`quali_${year}_${round}`, async () => {
    const response = await api.get(`/race/${year}/${round}/qualifying`);
    return response.data;
  }, 7200000).catch(() => ({ results: [] }));  // 2 hours

// --- Track visualization endpoints ---
export const getTrackCoordinates = (year, round) =>
  cachedGet(`track_${year}_${round}`, async () => {
    const response = await api.get(`/race/${year}/${round}/track`);
    return response.data;
  }, 86400000).catch(() => null);  // 24 hours — circuit shape never changes

export const getDriverPositions = (year, round) =>
  cachedGet(`positions_${year}_${round}`, async () => {
    const response = await api.get(`/race/${year}/${round}/positions`);
    return response.data;
  }, 86400000).catch(() => null);  // 24 hours — past race positions don't change

// --- Driver endpoints ---
export const getDrivers = async (year) => {
  try {
    const response = await api.get(`/drivers/${year}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

export const getDriverStats = async (year, driverId) => {
  try {
    const response = await api.get(`/drivers/${year}/${driverId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return {};
  }
};

// --- Driver Photos (OpenF1) ---
let _driverPhotosCache = null;

export const getDriverPhotos = async () => {
  if (_driverPhotosCache) return _driverPhotosCache;
  try {
    const response = await api.get('/drivers/photos/all');
    _driverPhotosCache = response.data;
    return response.data;
  } catch (error) {
    console.error('Error fetching driver photos:', error);
    return {};
  }
};

// --- Prediction endpoints ---
export const getPredictions = (year, round) =>
  cachedGet(`pred_${year}_${round}`, async () => {
    const response = await api.get(`/predictions/${year}/${round}`);
    return response.data;
  }, 1800000).catch(() => null);  // 30 min — predictions change less frequently

export const getQualifyingPredictions = (year, round) =>
  cachedGet(`predQ_${year}_${round}`, async () => {
    const response = await api.get(`/predictions/${year}/${round}/qualifying`);
    return response.data;
  }, 1800000).catch(() => null);

export const getSprintPredictions = (year, round) =>
  cachedGet(`predS_${year}_${round}`, async () => {
    const response = await api.get(`/predictions/${year}/${round}/sprint`);
    return response.data;
  }, 1800000).catch(() => null);// --- OpenF1 Live Data endpoints ---
export const getOpenF1Session = () =>
  cachedGet('openf1_session', async () => {
    const response = await api.get('/openf1/session/latest');
    return response.data;
  }, 15000).catch(() => ({ session: null, is_live: false }));

export const getOpenF1Locations = async () => {
  try {
    const response = await api.get('/openf1/location/latest');
    return response.data;
  } catch {
    return { locations: [] };
  }
};

export const getOpenF1Positions = async () => {
  try {
    const response = await api.get('/openf1/position/latest');
    return response.data;
  } catch {
    return { positions: [] };
  }
};

export const getOpenF1Drivers = (sessionKey = 'latest') =>
  cachedGet(`openf1_drivers_${sessionKey}`, async () => {
    const response = await api.get(`/openf1/drivers?session_key=${sessionKey}`);
    return response.data;
  }, 300000).catch(() => ({ drivers: [] }));

// --- Health check ---
export const getHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
};

export default api;

/**
 * Prefetch critical data on app startup to warm the backend cache.
 * This triggers the backend to load data from FastF1 / disk before the user navigates.
 * Called once from App.tsx on mount.
 */
export function prefetchCriticalData(year = 2026) {
  // Fire-and-forget: schedule + driver photos (needed on most pages)
  getRaceSchedule(year);
  getDriverPhotos();
  // Warm the prediction for round 2 (next race) in the background
  getPredictions(year, 2);
}
