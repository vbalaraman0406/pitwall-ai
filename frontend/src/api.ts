import axios from "axios";

const api = axios.create({ baseURL: "/f1/api" });

export const getRaces = (year: number) => api.get(`/races/${year}`);
export const getRaceResults = (year: number, round: number, session?: string) =>
  api.get(`/races/${year}/${round}/results`, { params: { session } });
export const getLaps = (year: number, round: number, driver?: string) =>
  api.get(`/races/${year}/${round}/laps`, { params: { driver } });
export const getTelemetry = (year: number, round: number, driver: string) =>
  api.get(`/races/${year}/${round}/telemetry/${driver}`);
export const getStrategy = (year: number, round: number) =>
  api.get(`/races/${year}/${round}/strategy`);
export const getDrivers = (year: number) => api.get(`/drivers/${year}`);
export const getDriverStats = (year: number, code: string) =>
  api.get(`/drivers/${year}/${code}/stats`);
export const compareDrivers = (year: number, drivers: string[]) =>
  api.get(`/drivers/${year}/compare`, { params: { drivers: drivers.join(",") } });

export default api;
