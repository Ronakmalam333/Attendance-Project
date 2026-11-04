import React, { useContext, useEffect, useState } from "react";
import "./details.css";
import { scheduleContext } from "../../../../context/Schedule";
import { AuthContext } from "../../../../context/AuthContext";
import axios from "../../../../tokenManager";
import Icons from "../../../../components/ui/Icons";
import Badge from "../../../../components/ui/Badge";
import Skeleton from "../../../../components/ui/Skeleton";

function Details() {
  const [date, setDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState({
    name: "Student",
    uid: "N/A",
    course: "",
    semester: "",
    profilePicture: null,
  });

  const { isAuthenticated } = useContext(AuthContext);
  const { mon = [], tue = [], wed = [], thu = [], fri = [], leave = [] } = useContext(scheduleContext) || {};

  useEffect(() => {
    let isMounted = true;
    const fetchStudentInfo = async () => {
      try {
        const response = await axios.get("/profile");
        const data = response.data;
        if (isMounted) {
          const fullName =
            data.name || `${data.firstname || ""} ${data.lastname || ""}`.trim();
          setStudentInfo({
            name: fullName || "Student",
            uid: data.uid || "N/A",
            course: data.course || "",
            semester: data.semester || "",
            profilePicture: data.profilePicture || null,
          });
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (isAuthenticated) {
      fetchStudentInfo();
    }

    const dateInterval = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => {
      isMounted = false;
      clearInterval(dateInterval);
    };
  }, [isAuthenticated]);

  const day = date.getDay();
  let schedule = leave;
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

  // Format date and time
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  // Calculate current slot index
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeDec = hours + minutes / 60;

  const getCurrentPeriodIndex = () => {
    if (timeDec >= 9.25 && timeDec < 10.25) return 0;
    if (timeDec >= 10.25 && timeDec < 11.25) return 1;
    if (timeDec >= 11.25 && timeDec < 12.25) return 2;
    if (timeDec >= 12.25 && timeDec < 14.0) return 3; // Lunch
    if (timeDec >= 14.0 && timeDec < 15.0) return 4;
    if (timeDec >= 15.0 && timeDec < 16.0) return 5;
    return -1;
  };

  const currentPeriodIndex = getCurrentPeriodIndex();

  const timeSlots = [
    "09:15 - 10:15",
    "10:15 - 11:15",
    "11:15 - 12:15",
    "12:15 - 02:00",
    "02:00 - 03:00",
    "03:00 - 04:00",
  ];

  return (
    <div className='erp-student-details-card erp-card'>
      {/* Student Profile Overview */}
      <div className='erp-student-profile-header'>
        <div className='erp-student-avatar-container'>
          {studentInfo.profilePicture ? (
            <img
              src={studentInfo.profilePicture}
              alt='Profile'
              className='erp-student-avatar-img'
            />
          ) : (
            <div className='erp-student-avatar-placeholder'>
              <Icons.User size={26} />
            </div>
          )}
        </div>

        <div className='erp-student-meta-block'>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Skeleton width="180px" height="24px" />
              <Skeleton width="120px" height="16px" />
            </div>
          ) : (
            <>
              <div className='erp-student-name-row'>
                <h2 className='erp-student-name'>{studentInfo.name}</h2>
                <span className='erp-student-uid-badge tabular-nums'>
                  {studentInfo.uid}
                </span>
              </div>
              <p className='erp-student-academics'>
                {studentInfo.course ? `${studentInfo.course}` : "Undergraduate"}
                {studentInfo.semester ? ` • Semester ${studentInfo.semester}` : ""}
              </p>
            </>
          )}
        </div>

        {/* Real-time Clock Widget */}
        <div className='erp-student-clock-widget'>
          <div className='erp-clock-time tabular-nums'>{formattedTime}</div>
          <div className='erp-clock-date'>{formattedDate}</div>
        </div>
      </div>

      <div className='erp-details-divider' />

      {/* Today's Schedule Overview */}
      <div className='erp-today-schedule-section'>
        <div className='erp-schedule-header-row'>
          <div className='erp-schedule-title-block'>
            <Icons.Calendar size={15} className='erp-section-icon' />
            <h3 className='erp-section-title'>Today's Academic Schedule</h3>
          </div>
          <span className='erp-schedule-status-hint'>
            {day === 0 || day === 6 ? "Weekend Roster" : "Standard Academic Schedule"}
          </span>
        </div>

        <div className='erp-schedule-timeline'>
          {schedule && Array.isArray(schedule) && schedule.length > 0 ? (
            schedule.map((item, index) => {
              const isCurrent = index === currentPeriodIndex;
              const isPast = currentPeriodIndex !== -1 && index < currentPeriodIndex;
              const slotTime =
                item?.start && item?.end
                  ? `${item.start} - ${item.end}`
                  : timeSlots[index] || "Scheduled Slot";
              const isLunch = item?.sub?.toLowerCase().includes("lunch") || item?.sub?.toLowerCase().includes("break");

              return (
                <div
                  key={index}
                  className={`erp-timeline-item ${isCurrent ? "is-current" : ""} ${isPast ? "is-past" : ""} ${isLunch ? "is-break" : ""}`}
                >
                  <div className='erp-timeline-time-col tabular-nums'>{slotTime}</div>
                  <div className='erp-timeline-marker'>
                    <div className='erp-timeline-dot' />
                  </div>
                  <div className='erp-timeline-content'>
                    <div className='erp-timeline-sub-row'>
                      <span className='erp-timeline-subject'>{item?.sub || "Free Period"}</span>
                      {isCurrent && (
                        <Badge variant="present" size="sm">
                          Live Now
                        </Badge>
                      )}
                      {isPast && (
                        <span className='erp-timeline-concluded-label'>Concluded</span>
                      )}
                    </div>
                    {item?.teacher && (
                      <span className='erp-timeline-teacher'>
                        Faculty: {item.teacher}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className='erp-empty-schedule-state'>
              <Icons.Clock size={16} className='erp-empty-schedule-icon' />
              <div className='erp-empty-schedule-content'>
                <span className='erp-empty-schedule-primary'>No formal lectures scheduled for today</span>
                <span className='erp-empty-schedule-secondary'>Laboratory & independent study day. Verify ad-hoc session codes in the check-in terminal.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Details;
