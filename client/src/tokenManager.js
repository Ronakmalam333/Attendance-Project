import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

let onRequestStart = null;
let onRequestEnd = null;

export const setNetworkActivityListeners = (startFn, endFn) => {
  onRequestStart = startFn;
  onRequestEnd = endFn;
};

// Create a custom axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed if using cookies
});

// Attach Authorization header and loading listeners for every request
api.interceptors.request.use(
  (config) => {
    if (onRequestStart && !config.silent) {
      onRequestStart();
    }
    return config;
  },
  (error) => {
    if (onRequestEnd) {
      onRequestEnd();
    }
    return Promise.reject(error);
  },
);

// Response interceptor to handle loading finish and 401 errors
api.interceptors.response.use(
  (response) => {
    if (onRequestEnd) {
      onRequestEnd();
    }
    return response;
  },
  (error) => {
    if (onRequestEnd) {
      onRequestEnd();
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      // Only redirect if user is on a protected route
      if (
        window.location.pathname !== "/" &&
        window.location.pathname !== "/signin"
      ) {
        window.location.href = "/";
      }
      // Suppress console error for auth status checks (expected when not logged in)
      if (error.config?.url?.includes("/auth/status")) {
        return Promise.reject({ ...error, silent: true });
      }
    }
    return Promise.reject(error);
  },
);

// Token manager helper functions
export const tokenManager = {
  async checkAuth() {
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
      return true;
    } catch {
      return false;
    }
  },

  async login(credentials) {
    try {
      const response = await api.post("/login", credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  async googleLogin(data) {
    try {
      const response = await api.post("/auth/google", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default api;
