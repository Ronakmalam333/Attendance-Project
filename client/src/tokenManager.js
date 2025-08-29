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

// Response interceptor to refresh token if expired
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await api.post("/auth/refresh");
        if (refreshResponse.status === 200) {
          // Save new token (if your backend sends it)
          if (refreshResponse.data.token) {
            localStorage.setItem("authToken", refreshResponse.data.token);
          }
          // Retry original request with new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Token manager helper functions
export const tokenManager = {
  async checkAuth() {
    try {
      const response = await api.get("/auth/status");
      return response.data;
    } catch (error) {
      console.error("Auth check failed:", error);
      return { authenticated: false };
    }
  },

  async refreshToken() {
    try {
      const response = await api.post("/auth/refresh");
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }
      return true;
    } catch {
      return false;
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
