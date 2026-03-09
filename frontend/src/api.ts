import axios from 'axios';

const api = axios.create({
  baseURL: '/f1/api',
  timeout: 30000,
});

export const getRaces = async (year: number) => {
  try {
    // Backend route: /api/race/schedule/{year}
    const response = await api.get(`/race/schedule/${year}`);
    const data = response.data;
    // Handle both array and object-with-schedule responses
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.schedule)) return data.schedule;
    if (data && typeof data === 'object') {
      // Try to extract any array from the response
      const keys = Object.keys(data);
      for (const key of keys) {
        if (Array.isArray(data[key])) return data[key];
      }
    }
    return [];
  } catch (error) {
    console.error('Error fetching races:', error);
    return [];
  }
};

export const getRaceResults = async (year: number, round: number) => {
  try {
    const response = await api.get(`/race/${year}/${round}/results`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching race results:', error);
    return [];
  }
};

export const getRaceLaps = async (year: number, round: number) => {
  try {
    const response = await api.get(`/race/${year}/${round}/laps`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching race laps:', error);
    return [];
  }
};

export const getDrivers = async (year: number) => {
  try {
    const response = await api.get(`/drivers/${year}`);
    return Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

export const getDriverStats = async (year: number, driverCode: string) => {
  try {
    const response = await api.get(`/drivers/${year}/${driverCode}/stats`);
    return response.data || {};
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return {};
  }
};

export const getDriverComparison = async (year: number, driver1: string, driver2: string) => {
  try {
    const response = await api.get(`/drivers/${year}/compare?d1=${driver1}&d2=${driver2}`);
    return response.data || {};
  } catch (error) {
    console.error('Error fetching driver comparison:', error);
    return {};
  }
};

export default api;
