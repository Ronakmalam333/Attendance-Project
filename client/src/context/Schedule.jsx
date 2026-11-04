import React, { createContext, useState, useEffect } from 'react';
import axios from '../tokenManager';

export const scheduleContext = createContext({
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: [],
    leave: []
});

export function Schedule({ children }) {
    const [schedule, setSchedule] = useState({
        mon: [],
        tue: [],
        wed: [],
        thu: [],
        fri: [],
        leave: []
    });

    useEffect(() => {
        axios.get("/schedule")
            .then((res) => {
                if (res.data) setSchedule(res.data);
            })
            .catch(() => {
                // If endpoint returns empty or offline, keep default empty schedule
            });
    }, []);

    return (
        <scheduleContext.Provider value={schedule}>
            {children}
        </scheduleContext.Provider>
    );
}
