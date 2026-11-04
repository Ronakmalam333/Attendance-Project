import React, { useContext, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import "./token.css";
import { scheduleContext } from "../../../../context/Schedule";
import { useToast } from "../../../../context/ToastContext";
import axios from "../../../../tokenManager";
import Icons from "../../../../components/ui/Icons";
import Badge from "../../../../components/ui/Badge";

function Token() {
  const toast = useToast();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
  } = useForm();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const { mon = [], tue = [], wed = [], thu = [], fri = [], leave = [] } = useContext(scheduleContext) || {};
  const [date, setDate] = useState(new Date());

  // Real-time time updater
  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch active sessions
  const fetchActiveSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await axios.get("/tokens/active");
      setActiveSessions(res.data || []);
    } catch (err) {
      // Silently fall back to empty
      setActiveSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
    // Poll every 30 seconds for active tokens
    const sessionTimer = setInterval(fetchActiveSessions, 30000);
    return () => clearInterval(sessionTimer);
  }, []);

  // Detect current subject by timetable
  const day = date.getDay();
  let currentSchedule;
  switch (day) {
    case 1: currentSchedule = mon; break;
    case 2: currentSchedule = tue; break;
    case 3: currentSchedule = wed; break;
    case 4: currentSchedule = thu; break;
    case 5: currentSchedule = fri; break;
    default: currentSchedule = leave; break;
  }

  const sub = Array.isArray(currentSchedule)
    ? currentSchedule.map((element) => element?.sub || "N/A")
    : [];

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const timeDec = hours + minutes / 60;

  let currentTimetableSubject = "General Session";
  if (timeDec >= 9.25 && timeDec < 10.25) currentTimetableSubject = sub[0] || "No Class Scheduled";
  else if (timeDec >= 10.25 && timeDec < 11.25) currentTimetableSubject = sub[1] || "No Class Scheduled";
  else if (timeDec >= 11.25 && timeDec < 12.25) currentTimetableSubject = sub[2] || "No Class Scheduled";
  else if (timeDec >= 12.25 && timeDec < 14.0) currentTimetableSubject = sub[3] || "Lunch Break";
  else if (timeDec >= 14.0 && timeDec < 15.0) currentTimetableSubject = sub[4] || "No Class Scheduled";
  else if (timeDec >= 15.0 && timeDec < 16.0) currentTimetableSubject = sub[5] || "No Class Scheduled";

  const onSubmit = async (data) => {
    const rawToken = data.subToken?.trim().toUpperCase();
    if (!rawToken || rawToken.length !== 4) {
      toast.warning("Please enter a valid 4-character attendance token.", "Invalid Token");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("/attendance/submit", {
        token: rawToken,
        subject: currentTimetableSubject !== "No Class Scheduled" && currentTimetableSubject !== "Lunch Break"
          ? currentTimetableSubject
          : "AUTO_DETECT",
      });

      toast.success(response.data.message || "Attendance recorded successfully!", "Attendance Marked");
      reset();
      fetchActiveSessions();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to submit attendance token. Please check code or expiry.";
      toast.error(errorMessage, "Check-in Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseToken = (tokenCode) => {
    setValue("subToken", tokenCode);
    onSubmit({ subToken: tokenCode });
  };

  return (
    <div className='erp-token-station erp-card'>
      {/* Header */}
      <div className='erp-token-header'>
        <div className='erp-token-header-title'>
          <Icons.CheckSquare size={18} className='erp-token-header-icon' />
          <div>
            <h3 className='erp-token-title'>Session Attendance Check-in</h3>
            <p className='erp-token-subtitle'>
              Active Timetable Target: <strong>{currentTimetableSubject}</strong>
            </p>
          </div>
        </div>
        <button
          type='button'
          className='erp-btn erp-btn-ghost erp-refresh-sessions-btn'
          onClick={fetchActiveSessions}
          title='Refresh active sessions'
        >
          <Icons.Refresh size={14} />
        </button>
      </div>

      {/* Main Check-In Form */}
      <form className='erp-token-form' onSubmit={handleSubmit(onSubmit)}>
        <div className='erp-token-input-group'>
          <label htmlFor='subToken' className='erp-label'>
            4-Character Attendance Code
          </label>
          <div className='erp-token-input-wrapper'>
            <input
              id='subToken'
              {...register("subToken", { required: true })}
              type='text'
              maxLength={4}
              placeholder='••••'
              autoComplete='off'
              spellCheck='false'
              className='erp-token-code-input tabular-nums'
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
              }}
              disabled={isSubmitting}
            />
            <button
              type='submit'
              className='erp-btn erp-btn-primary erp-token-submit-btn'
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className='erp-spinner-sm' />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <Icons.Check size={16} />
                  <span>Submit Code</span>
                </>
              )}
            </button>
          </div>
          <span className='erp-token-help-text'>
            Enter the 4-character alphanumeric code announced or projected by your faculty.
          </span>
        </div>
      </form>

      {/* Published Active Class Sessions (from server /tokens/active) */}
      <div className='erp-active-sessions-section'>
        <div className='erp-active-sessions-title-row'>
          <span className='erp-active-sessions-heading'>
            Currently Broadcast Sessions ({activeSessions.length})
          </span>
          <span className='erp-active-ping-badge'>
            <span className='erp-status-dot' /> Accepting Check-ins
          </span>
        </div>

        {loadingSessions ? (
          <div className='erp-sessions-loading'>Checking broadcast signals...</div>
        ) : activeSessions.length > 0 ? (
          <div className='erp-active-sessions-list'>
            {activeSessions.map((session, index) => {
              const expireDate = new Date(session.validUntil);
              const validTimeStr = expireDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div key={index} className='erp-active-session-card'>
                  <div className='erp-session-card-info'>
                    <div className='erp-session-sub-row'>
                      <strong className='erp-session-name'>{session.subject}</strong>
                      <Badge variant="present" size="sm">
                        Open
                      </Badge>
                    </div>
                    <div className='erp-session-meta'>
                      <span>Faculty: {session.faculty || "Academic Staff"}</span>
                      <span>•</span>
                      <span>Valid until {validTimeStr}</span>
                    </div>
                  </div>
                  {session.token && (
                    <button
                      type='button'
                      className='erp-btn erp-btn-secondary erp-btn-use-token'
                      onClick={() => handleUseToken(session.token)}
                      disabled={isSubmitting}
                    >
                      <Icons.Key size={14} />
                      <span>Check in: {session.token}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className='erp-no-active-sessions'>
            <Icons.Info size={16} />
            <span>No faculty session is currently active. Ready when code is announced.</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Token;
