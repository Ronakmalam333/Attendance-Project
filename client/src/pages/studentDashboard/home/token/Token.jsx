import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "./token.css";
import { scheduleContext } from "../../../../context/Schedule";
import axios from '../../../../tokenManager';

function Token() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await axios.post('/attendance/submit', {
        token: data.subToken.toUpperCase(),
        subject: onTimeSub !== "No Classes Found" ? onTimeSub : 'AUTO_DETECT'
      });

      alert(response.data.message || 'Attendance submitted successfully!');
      reset();
    } catch (error) {
      console.error('Error submitting attendance:', error);
      const errorMessage = error.response?.data?.message || 'Error submitting attendance';
      alert('Failed to submit attendance: ' + errorMessage);
    }
  };

  const { mon, tue, wed, thu, fri, leave } = useContext(scheduleContext);

  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const day = date.getDay();
  let currentSub;

  switch (day) {
    case 1:
      currentSub = mon;
      break;
    case 2:
      currentSub = tue;
      break;
    case 3:
      currentSub = wed;
      break;
    case 4:
      currentSub = thu;
      break;
    case 5:
      currentSub = fri;
      break;
    default:
      currentSub = leave;
  }

  const sub = currentSub && Array.isArray(currentSub) ? currentSub.map(element => element?.sub || 'N/A') : [];
  

  const hours = date.getHours();
  const minutes = date.getMinutes();
  
  const time = `${hours}.${String(minutes).padStart(2, "0")}`;


  
  let onTimeSub = "No Classes Found";

  if (time >= 9.15 && time < 10.15) onTimeSub = sub[0] || "No Classes Found";
  else if (time >= 10.15 && time < 11.15) onTimeSub = sub[1] || "No Classes Found";
  else if (time >= 11.15 && time < 12.15) onTimeSub = sub[2] || "No Classes Found";
  else if (time >= 12.15 && time < 14) onTimeSub = sub[3] || "No Classes Found";
  else if (time >= 14 && time < 15) onTimeSub = sub[4] || "No Classes Found";
  else if (time >= 15 && time < 16) onTimeSub = sub[5] || "No Classes Found";

  return (
    <div className="token_contain">
      <span className="current-time">{`${hours}:${minutes}`}</span>
      <form className="token_box" onSubmit={handleSubmit(onSubmit)}>
        <h1 className="sub_name">{onTimeSub}</h1>
        <input
          {...register("subToken", {
            required: "Subject token required",
            minLength: { value: 4, message: "Enter 4-character token only" },
            maxLength: { value: 4, message: "Enter 4-character token only" },
            pattern: { value: /^[A-Z0-9]{4}$/, message: "Token must be 4 uppercase letters/numbers" }
          })}
          className="token_input"
          type="text"
          placeholder="Enter Subject Token (e.g., EX7G)"
          style={{ textTransform: 'uppercase' }}
          onInput={(e) => {
            let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if(value.length > 4){
              value = value.substring(0,4);
            }
            e.target.value = value;
          }}
        />
        {errors.subToken && <span className="error">{errors.subToken.message}</span>}
        <button className="submit_btn" type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Token;
