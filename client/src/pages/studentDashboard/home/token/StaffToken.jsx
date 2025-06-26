import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "./token.css";
import { scheduleContext } from "../../../context/Schedule";

function Token() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [token, setToken] = useState(0);

    function genToken() {
        setToken(Math.floor(1000 + Math.random()*9000));
        console.log(token)
    }

    const onSubmit = (data) => {
        console.log(data);
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

    const sub = currentSub ? currentSub.map(element => element.sub) : [];


    const hours = date.getHours();
    const minutes = date.getMinutes();

    const time = `${hours}.${String(minutes).padStart(2, "0")}`;



    let onTimeSub = "No Classes Found";

    if (time >= 9.15 && time < 10.15) onTimeSub = sub[0];
    else if (time >= 10.15 && time < 11.15) onTimeSub = sub[1];
    else if (time >= 11.15 && time < 12.15) onTimeSub = sub[2];
    else if (time >= 12.15 && time < 14) onTimeSub = sub[3];
    else if (time >= 14 && time < 15) onTimeSub = sub[4];
    else if (time >= 15 && time < 16) onTimeSub = sub[5];

    return (
        <div className="token_contain">
            <span className="current-time">{`${hours}:${minutes}`}</span>
            <form className="token_box" onSubmit={handleSubmit(onSubmit)}>
                <h1 className="sub_name">{onTimeSub}</h1>
                <h2>{token > 0 ? token : "0000"}</h2>
                {errors.subToken && <span className="error">{errors.subToken.message}</span>}
                <button className="submit_btn" type="submit" onClick={genToken}>Generate Token</button>
            </form>
        </div>
    );
}

export default Token;
