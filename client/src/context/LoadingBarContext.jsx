import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from "react";
import LoadingBar from "../components/ui/LoadingBar";
import { setNetworkActivityListeners } from "../tokenManager";

const LoadingBarContext = createContext(null);

export const LoadingBarProvider = ({ children }) => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const activeRequests = useRef(0);
  const timerRef = useRef(null);

  const startLoading = useCallback(() => {
    activeRequests.current += 1;
    if (activeRequests.current === 1) {
      setVisible(true);
      setProgress(20);

      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev < 65) return prev + Math.floor(Math.random() * 8 + 5);
          if (prev < 90) return prev + Math.floor(Math.random() * 4 + 1);
          return prev;
        });
      }, 200);
    }
  }, []);

  const finishLoading = useCallback(() => {
    activeRequests.current = Math.max(0, activeRequests.current - 1);
    if (activeRequests.current === 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 350);
    }
  }, []);

  useEffect(() => {
    setNetworkActivityListeners(startLoading, finishLoading);
    return () => {
      setNetworkActivityListeners(null, null);
    };
  }, [startLoading, finishLoading]);

  return (
    <LoadingBarContext.Provider value={{ startLoading, finishLoading, progress, visible }}>
      <LoadingBar progress={progress} visible={visible} />
      {children}
    </LoadingBarContext.Provider>
  );
};

export const useLoadingBar = () => {
  const context = useContext(LoadingBarContext);
  if (!context) {
    throw new Error("useLoadingBar must be used within a LoadingBarProvider");
  }
  return context;
};

export default LoadingBarContext;
