import axios from 'axios';

const api = axios.create({
  baseURL: '/f1/api',
  timeout: 60000,
});

// --- Race endpoints ---
export const getRaceSchedule = async (year) => {
  try {
    const response = await api.get(`/race/schedule/${year}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching race schedule:', error);
    return [];
  }
};

export const getRaceResults = async (year, round) => {
  try {
    const response = await api.get(`/race/${year}/${round}/results`);
    return response.data;
  } catch (error) {
    console.error('Error fetching race results:', error);
    return { results: [] };
  }
};

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
export const getPredictions = async (year, round) => {
  try {
    const response = await api.get(`/predictions/${year}/${round}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching predictions:', error);
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
