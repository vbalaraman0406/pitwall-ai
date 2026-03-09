import axios from 'axios';

const api = axios.create({
  baseURL: '/f1/api',
  timeout: 30000,
});

export const getRaces = async (year: number) => {
  try {
    const response = await api.get(`/races/${year}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching races:', error);
    return [];
  }
};

export const getRaceResults = async (year: number, round: number) => {
  try {
    const response = await api.get(`/race/${year}/${round}/results`);
    return response.data;
  } catch (error) {
    console.error('Error fetching race results:', error);
    return [];
  }
};

export const getRaceLaps = async (year: number, round: number) => {
  try {
    const response = await api.get(`/race/${year}/${round}/laps`);
    return response.data;
  } catch (error) {
    console.error('Error fetching race laps:', error);
    return [];
  }
};

export const getDrivers = async (year: number) => {
  try {
    const response = await api.get(`/drivers/${year}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching drivers:', error);
    return [];
  }
};

export const getDriverStats = async (year: number, driverId: string) => {
  try {
    const response = await api.get(`/driver/${year}/${driverId}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching driver stats:', error);
    return {};
  }
};

export default api;
