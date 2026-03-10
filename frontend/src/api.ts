import axios from 'axios';

const api = axios.create({
  baseURL: '/f1/api',
  timeout: 120000, // 2 min for cold starts
});

// ──── In-memory response cache ────
const _cache: Record<string, { data: any; ts: number }> = {};

function cachedGet(key: string, fetcher: () => Promise<any>, ttlMs: number = 300000) {
  const cached = _cache[key];
  if (cached && Date.now() - cached.ts < ttlMs) {
    return Promise.resolve(cached.data);
  }
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
  }, 3600000).catch(() => []);

export const getRaceResults = (year, round) =>
  cachedGet(`results_${year}_${round}`, async () => {
    const response = await api.get(`/race/${year}/${round}/results`);
    return response.data;
  }, 1800000).catch(() => ({ results: [] }));

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
  }, 1800000).catch(() => ({ results: [] }));

// --- Track visualization endpoints ---
export const getTrackCoordinates = async (year, round) => {
  try {
    const response = await api.get(`/race/${year}/${round}/track`);
    return response.data;
  } catch (error) {
    console.error('Error fetching track coordinates:', error);
    return null;
  }
};

export const getDriverPositions = async (year, round) => {
  try {
    const response = await api.get(`/race/${year}/${round}/positions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver positions:', error);
    return null;
  }
};

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
  }, 300000).catch(() => null);

export const getQualifyingPredictions = async (year, round) => {
  try {
    const response = await api.get(`/predictions/${year}/${round}/qualifying`);
    return response.data;
  } catch (error) {
    console.error('Error fetching qualifying predictions:', error);
    return null;
  }
};

export const getSprintPredictions = async (year, round) => {
  try {
    const response = await api.get(`/predictions/${year}/${round}/sprint`);
    return response.data;
  } catch (error) {
    console.error('Error fetching sprint predictions:', error);
    return null;
  }
};
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
