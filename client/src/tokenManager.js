import axios from "axios";

const API_BASE_URL = "http://localhost:5000";

// Create a custom axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed if using cookies
});

// Attach Authorization header for every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken"); // store this after login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const token = localStorage.getItem("authToken");
      if (token) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        if (window.location.pathname !== "/" && window.location.pathname !== "/signin") {
          window.location.href = "/";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Token manager helper functions
export const tokenManager = {
  async checkAuth() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      return { authenticated: false };
    }
    try {
      const response = await api.get("/auth/status");
      return response.data;
    } catch (error) {
      return { authenticated: false };
    }
  },



  async logout() {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("authToken");
      return true;
    } catch {
      return false;
    }
  },

  async login(credentials) {
    try {
      const response = await api.post("/login", credentials);
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
