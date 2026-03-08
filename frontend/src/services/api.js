import axios from 'axios';

/**
 * @description Axios API client for Pitwall.ai backend.
 * All endpoint functions return promises resolving to response data.
 */
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/** Get season race calendar */
export const getRaces = (year = 2025) => api.get(`/races?year=${year}`).then(r => r.data);

/** Get race detail with results */
export const getRaceDetail = (year, round) => api.get(`/races/${year}/${round}`).then(r => r.data);

/** Get all drivers for a season */
export const getDrivers = (year = 2025) => api.get(`/drivers?year=${year}`).then(r => r.data);

/** Get driver season stats */
export const getDriverStats = (driverId, year = 2025) =>
  api.get(`/drivers/${driverId}/stats?year=${year}`).then(r => r.data);

/** Get telemetry data */
export const getTelemetry = (year, round, session, driver) =>
  api.get(`/telemetry/${year}/${round}/${session}/${driver}`).then(r => r.data);

/** Get race predictions */
export const getPredictions = (year, round) =>
  api.get(`/predictions/${year}/${round}`).then(r => r.data);

/** Health check */
export const healthCheck = () => api.get('/health').then(r => r.data);

export default api;
