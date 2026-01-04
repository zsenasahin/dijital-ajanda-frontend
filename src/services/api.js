import axios from 'axios';

// Backend 'launchSettings.json' icinde 5000 portunda calisiyor
const baseURL = 'http://localhost:5000';

export const api = axios.create({
  baseURL,
  withCredentials: false,
  timeout: 15000 // 15 saniye zaman aşımı (veritabanı yavaş olabilir)
});

export default api;


