import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 30000 })

export const getRaces = (year: number) => api.get(`/races/${year}`)
export const getRaceResults = (year: number, round: number, session = 'R') =>
  api.get(`/races/${year}/${round}/results`, { params: { session } })
export const getLapData = (year: number, round: number, driver?: string, session = 'R') =>
  api.get(`/races/${year}/${round}/laps`, { params: { driver, session } })
export const getTelemetry = (year: number, round: number, driver: string, lap?: number, session = 'R') =>
  api.get(`/races/${year}/${round}/telemetry/${driver}`, { params: { lap, session } })
export const getStrategy = (year: number, round: number, session = 'R') =>
  api.get(`/races/${year}/${round}/strategy`, { params: { session } })
export const getDrivers = (year: number) => api.get(`/drivers/${year}`)
export const getDriverStats = (year: number, code: string) => api.get(`/drivers/${year}/${code}/stats`)
export const compareDrivers = (year: number, drivers: string) =>
  api.get(`/drivers/${year}/compare`, { params: { drivers } })

export default api
