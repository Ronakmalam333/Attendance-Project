import React, { useContext, useEffect, useState } from 'react';
import './details.css';
import { scheduleContext } from '../../../../context/Schedule';
import { AuthContext } from '../../../../context/AuthContext';

function Details() {
  const [date, setDate] = useState(new Date());
  const [studentInfo, setStudentInfo] = useState({ firstname: '', lastname: '', uid: '' });
  const { token } = useContext(AuthContext);
  const { mon, tue, wed, thu, fri, leave } = useContext(scheduleContext);

  // Fetch student data on mount
  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const response = await fetch('http://localhost:5000/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setStudentInfo({
            firstname: data.firstname,
            lastname: data.lastname,
            uid: data.uid
          });
        } else {
          console.error('Failed to fetch student info:', data.message);
        }
      } catch (error) {
        console.error('Error fetching student info:', error);
      }
    };

    if (token) {
      fetchStudentInfo();
    }

    const dateInterval = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => clearInterval(dateInterval);
  }, [token]);

  let day = date.getDay();
  let schedule;
  switch (day) {
    case 1:
      schedule = mon;
      break;
    case 2:
      schedule = tue;
      break;
    case 3:
      schedule = wed;
      break;
    case 4:
      schedule = thu;
      break;
    case 5:
      schedule = fri;
      break;
    default:
      schedule = leave;
      break;
  }

  let scheduleLength = [];
  for (let i = 1; i <= schedule.length; i++) {
    scheduleLength.push(i);
  }

  return (
    <div className='schedule-contain'>
      <div className='user_info'>
        <div id='profile_img'>
          <svg xmlns="http://www.w3.org/2000/svg" height="80px" viewBox="0 -960 960 960" width="80px" fill="#000000">
            <path d="M480-504.62q-49.5 0-84.75-35.25T360-624.62q0-49.5 35.25-84.75T480-744.62q49.5 0 84.75 35.25T600-624.62q0 49.5-35.25 84.75T480-504.62ZM200-215.38v-65.85q0-24.77 14.42-46.35 14.43-21.57 38.81-33.5 56.62-27.15 113.31-40.73 56.69-13.57 113.46-13.57 56.77 0 113.46 13.57 56.69 13.58 113.31 40.73 24.38 11.93 38.81 33.5Q760-306 760-281.23v65.85H200Zm40-40h480v-25.85q0-13.31-8.58-25-8.57-11.69-23.73-19.77-49.38-23.92-101.83-36.65-52.45-12.73-105.86-12.73t-105.86 12.73Q321.69-349.92 272.31-326q-15.16 8.08-23.73 19.77-8.58 11.69-8.58 25v25.85Zm240-289.24q33 0 56.5-23.5t23.5-56.5q0-33-23.5-56.5t-56.5-23.5q-33 0-56.5 23.5t-23.5 56.5q0 33 23.5 56.5t56.5 23.5Zm0-80Zm0 369.24Z" />
          </svg>
        </div>
        <div id='user_details'>
          <h2>{`${studentInfo.firstname} ${studentInfo.lastname}`}</h2>
          <p>UID: {studentInfo.uid}</p>
        </div>
      </div>
      <div className="schedule">
        <h2>{new Date().toDateString()}</h2>
        <div className='current-schedule'>
          <div className='subjects-contain'>
            {schedule.map((value, index) => (
              <div key={index} className='today-sub'>
                <div className='today-time'>
                  <div>{value.start}</div>
                  <div>{value.end}</div>
                </div>
                <div className='sub-name'>{value.sub}</div>
              </div>
            ))}
          </div>
          <div className='attendance'>
            {scheduleLength.map((value, index, arr) => (
              <div key={index} style={{ height: `calc(100%/${arr.length})` }}>pending</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Details;