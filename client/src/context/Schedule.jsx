import React, { createContext } from 'react'

export const scheduleContext = createContext();

export function Schedule({ children }) {
    const mon = [{
        "sub": "FERAJ",
        "start": "09:15 AM",
        "end": "10:15 AM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "BENJ",
        "start": "10:15 AM",
        "end": "11:15 AM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "ND",
        "start": "11:15 AM",
        "end": "12:15 AM",
        "faculty": "Sakshi Kasera"
    },
    {
        "sub": "OOPIC",
        "start": "01:00 PM",
        "end": "02:00 PM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "OOPIC",
        "start": "02:00 PM",
        "end": "03:00 PM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "ND",
        "start": "03:00 PM",
        "end": "04:00 PM",
        "faculty": "Sakshi Kasera"
    }]

    const tue = [{
        "sub": "FERAJ",
        "start": "09:15 AM",
        "end": "10:15 AM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "ES",
        "start": "10:15 AM",
        "end": "11:15 AM",
        "faculty": "Dhruv Trivedi"
    },
    {
        "sub": "OOPIC",
        "start": "11:15 AM",
        "end": "12:15 AM",
        "faculty": "Ashutosh Pande"
    },
    {
        "sub": "Library",
        "start": "01:00 PM",
        "end": "02:00 PM"
    },
    {
        "sub": "Maths-II",
        "start": "02:00 PM",
        "end": "03:00 PM",
        "faculty": "Vardhan Parmar"
    },
    {
        "sub": "Sports",
        "start": "03:00 PM",
        "end": "04:00 PM"
    }]

    const wed = [{
        "sub": "Library",
        "start": "09:15 AM",
        "end": "10:15 AM"
    },
    {
        "sub": "ND",
        "start": "10:15 AM",
        "end": "11:15 AM",
        "faculty": "Sakshi Kasera"
    },
    {
        "sub": "ND",
        "start": "11:15 AM",
        "end": "12:15 AM",
        "faculty": "Sakshi Kasera"
    },
    {
        "sub": "Maths-II",
        "start": "11:15 AM",
        "end": "12:15 AM",
        "faculty": "Vardhan Parmar"
    },
    {
        "sub": "Sports",
        "start": "01:00 PM",
        "end": "03:00 PM"
    },
    {
        "sub": "Free Class",
        "start": "03:00 PM",
        "end": "04:00 PM"
    }]

    const thu = [{
        "sub": "OOPIC",
        "start": "09:15 AM",
        "end": "10:15 AM",
        "faculty": "Ashutosh Pande"
    },
    {
        "sub": "ES",
        "start": "10:15 AM",
        "end": "11:15 AM",
        "faculty": "Dhruv Trivedi"
    },
    {
        "sub": "BENJ",
        "start": "11:15 AM",
        "end": "12:15 AM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "FERAJ",
        "start": "01:00 PM",
        "end": "02:00 PM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "FERAJ",
        "start": "02:00 PM",
        "end": "03:00 PM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "FERAJ",
        "start": "03:00 PM",
        "end": "04:00 PM",
        "faculty": "Adil Ahmed"
    }]
    const fri = [{
        "sub": "BENJ",
        "start": "09:15 AM",
        "end": "10:15 AM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "BENJ",
        "start": "10:15 AM",
        "end": "11:15 AM",
        "faculty": "Adil Ahmed"
    },
    {
        "sub": "OOPSIC",
        "start": "11:15 AM",
        "end": "12:15 AM",
        "faculty": "Ashutosh Pande"
    },
    {
        "sub": "Maths-II",
        "start": "01:00 AM",
        "end": "02:00 AM",
        "faculty": "Vardhan Parmar"
    },
    {
        "sub": "ND",
        "start": "02:00 PM",
        "end": "03:00 PM",
        "faculty": "Sakshi Kasera"
    },
    {
        "sub": "BENJ",
        "start": "03:00 PM",
        "end": "04:00 PM",
        "faculty": "Adil Ahmed"
    }]

    const leave = [{
        "sub": "Today is Leave",
        "start": "",
        "end": ""
    }]

    return (
        <scheduleContext.Provider value={{ mon, tue, wed, thu, fri, leave }}>
            {children}
        </scheduleContext.Provider>
    )
}