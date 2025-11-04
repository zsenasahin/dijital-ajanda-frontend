import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL,
  withCredentials: false
});

export default api;


