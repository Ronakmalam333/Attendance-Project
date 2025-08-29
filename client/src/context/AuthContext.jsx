import React, { createContext, useEffect, useState } from 'react';
import { tokenManager } from '../tokenManager';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    // Store user data in localStorage for persistence
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('role', userData.role);
  };

  const logout = async () => {
    try {
      await tokenManager.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('user');
    localStorage.removeItem('role');
  };

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const authStatus = await tokenManager.checkAuth();
        if (authStatus.authenticated) {
          setIsAuthenticated(true);
          // Try to get user data from localStorage first
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error('Error parsing stored user data:', error);
              localStorage.removeItem('user');
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('user');
          localStorage.removeItem('role');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      login, 
      logout, 
      isLoading,
      // Keep token for backward compatibility
      token: isAuthenticated ? 'authenticated' : null
    }}>
      {children}
    </AuthContext.Provider>
  );
};