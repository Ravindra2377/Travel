import axios from 'axios';
import Constants from 'expo-constants';

import { Platform } from 'react-native';

const getApiUrl = () => {
  // Use your laptop's local IP address so the app can reach the backend
  return 'http://192.168.1.3:8080';
};

export const API_URL = getApiUrl();
export const SCRAPER_API_URL = `${API_URL}/compare`;

const api = axios.create({
  baseURL: API_URL,
});

export default api;
