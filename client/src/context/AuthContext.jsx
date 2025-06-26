import React, { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const login = (userData, token) => {
    setUser(userData);
    setToken(token);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('loginTime', Date.now());
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTime');
  };

  useEffect(() => {
  const storedToken = localStorage.getItem('token');
  const storedUserRaw = localStorage.getItem('user');
  const loginTime = localStorage.getItem('loginTime');

  if (storedToken && storedUserRaw && loginTime) {
    const timeElapsed = Date.now() - parseInt(loginTime, 10);
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (timeElapsed < twentyFourHours) {
      try {
        const parsedUser = storedUserRaw !== "undefined" ? JSON.parse(storedUserRaw) : null;

        if (parsedUser) {
          setUser(parsedUser);
          setToken(storedToken);
        } else {
          logout();
        }
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        logout();
      }
    } else {
      logout(); 
    }
  } else {
    logout();
  }

  setIsLoading(false);
}, []);



  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};