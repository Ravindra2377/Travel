import axios from 'axios';
import { secureStorage } from "../services/secureStorage";
const getApiUrl = () => {
  return 'https://comparex-8ztd.onrender.com';
};

export const API_URL = getApiUrl();
export const SCRAPER_API_URL = `${API_URL}/compare`;

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem("userToken");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
