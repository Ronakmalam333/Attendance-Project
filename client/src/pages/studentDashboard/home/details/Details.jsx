import React, { useContext, useEffect, useState } from "react";
import "./details.css";
import { scheduleContext } from "../../../../context/Schedule";
import { AuthContext } from "../../../../context/AuthContext";
import axios from "../../../../tokenManager";

function Details() {
  const [date, setDate] = useState(new Date());
  const [studentInfo, setStudentInfo] = useState({
    firstname: "",
    lastname: "",
    uid: "",
    profilePicture: null,
  });
  const { isAuthenticated } = useContext(AuthContext);
  const { mon, tue, wed, thu, fri, leave } = useContext(scheduleContext);

  // Fetch student data on mount
  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const response = await axios.get("/profile");
        const data = response.data;
        // Handle both name formats: single name field or separate first/last names
        const fullName =
          data.name || `${data.firstname || ""} ${data.lastname || ""}`.trim();
        const [firstName, ...lastNameParts] = fullName.split(" ");
        setStudentInfo({
          firstname: firstName || "Student",
          lastname: lastNameParts.join(" ") || "",
          uid: data.uid || "N/A",
          profilePicture: data.profilePicture || null,
        });
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.error("Unauthorized: Please log in again.");
        } else {
          console.error("Error fetching student info:", error);
        }
        // Set fallback data
        setStudentInfo({
          firstname: "Student",
          lastname: "",
          uid: "N/A",
          profilePicture: null,
        });
      }
    };

    if (isAuthenticated) {
      fetchStudentInfo();
    }

    const dateInterval = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(dateInterval);
  }, [isAuthenticated]);

  let day = date.getDay();
  let schedule = leave; // Default fallback
  switch (day) {
    case 1:
      schedule = mon || leave;
      break;
    case 2:
      schedule = tue || leave;
      break;
    case 3:
      schedule = wed || leave;
      break;
    case 4:
      schedule = thu || leave;
      break;
    case 5:
      schedule = fri || leave;
      break;
    default:
      schedule = leave;
      break;
  }

  let scheduleLength = [];
  if (schedule && schedule.length > 0) {
    for (let i = 1; i <= schedule.length; i++) {
      scheduleLength.push(i);
    }
  }

  return (
    <div className='schedule-contain'>
      <div className='user_info'>
        <div id='profile_img'>
          {studentInfo.profilePicture ? (
            <img
              src={studentInfo.profilePicture}
              alt='Profile'
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <svg
              xmlns='http://www.w3.org/2000/svg'
              height='80px'
              viewBox='0 -960 960 960'
              width='80px'
              fill='#000000'
            >
              <path d='M480-504.62q-49.5 0-84.75-35.25T360-624.62q0-49.5 35.25-84.75T480-744.62q49.5 0 84.75 35.25T600-624.62q0 49.5-35.25 84.75T480-504.62ZM200-215.38v-65.85q0-24.77 14.42-46.35 14.43-21.57 38.81-33.5 56.62-27.15 113.31-40.73 56.69-13.57 113.46-13.57 56.77 0 113.46 13.57 56.69 13.58 113.31 40.73 24.38 11.93 38.81 33.5Q760-306 760-281.23v65.85H200Zm40-40h480v-25.85q0-13.31-8.58-25-8.57-11.69-23.73-19.77-49.38-23.92-101.83-36.65-52.45-12.73-105.86-12.73t-105.86 12.73Q321.69-349.92 272.31-326q-15.16 8.08-23.73 19.77-8.58 11.69-8.58 25v25.85Zm240-289.24q33 0 56.5-23.5t23.5-56.5q0-33-23.5-56.5t-56.5-23.5q-33 0-56.5 23.5t-23.5 56.5q0 33 23.5 56.5t56.5 23.5Zm0-80Zm0 369.24Z' />
            </svg>
          )}
        </div>
        <div id='user_details'>
          <h2>{`${studentInfo.firstname}${
            studentInfo.lastname ? " " + studentInfo.lastname : ""
          }`}</h2>
          <p>UID: {studentInfo.uid}</p>
        </div>
      </div>
      <div className='schedule'>
        <h2>{new Date().toDateString()}</h2>
        <div className='current-schedule'>
          <div className='subjects-contain'>
            {schedule && schedule.length > 0 ? (
              schedule.map((value, index) => (
                <div key={index} className='today-sub'>
                  <div className='today-time'>
                    <div>{value?.start || "N/A"}</div>
                    <div>{value?.end || "N/A"}</div>
                  </div>
                  <div className='sub-name'>{value?.sub || "No Subject"}</div>
                </div>
              ))
            ) : (
              <div className='today-sub'>
                <div className='sub-name'>No classes scheduled</div>
              </div>
            )}
          </div>
          <div className='attendance'>
            {scheduleLength.length > 0 ? (
              scheduleLength.map((value, index, arr) => (
                <div key={index} style={{ height: `calc(100%/${arr.length})` }}>
                  pending
                </div>
              ))
            ) : (
              <div>No attendance data</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Details;
