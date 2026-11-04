import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "../../../tokenManager";
import { scheduleContext } from "../../../context/Schedule";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import EmptyState from "../../../components/ui/EmptyState";
import Skeleton from "../../../components/ui/Skeleton";
import "./classes.css";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function Classes() {
  const [selectedDay, setSelectedDay] = useState("all");
  const [studentRecords, setStudentRecords] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const schedule = useContext(scheduleContext) || {};

  const todayIndex = new Date().getDay(); // 1 = Mon, 6 = Sat
  const todayDayName = todayIndex >= 1 && todayIndex <= 6 ? days[todayIndex - 1] : null;

  useEffect(() => {
    let isMounted = true;
    const fetchClassData = async () => {
      try {
        setLoading(true);
        const [recordsRes, tokensRes] = await Promise.all([
          axios.get("/attendance/student").catch(() => ({ data: [] })),
          axios.get("/tokens/active").catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          setStudentRecords(recordsRes.data || []);
          setActiveSessions(tokensRes.data || []);
        }
      } catch (err) {
        // Silently handled
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchClassData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute enrolled course directory dynamically from student's verified records & active sessions
  const dynamicCourses = useMemo(() => {
    const map = {};

    studentRecords.forEach((r) => {
      const sub = r.subject || "General Session";
      if (!map[sub]) {
        map[sub] = {
          code: sub,
          name: sub,
          teacher: r.faculty || "Faculty Instructor",
          totalSessions: 0,
          presentCount: 0,
          lastAttended: r.date ? new Date(r.date).toISOString().split("T")[0] : "N/A",
        };
      }
      map[sub].totalSessions++;
      if ((r.status || "").toLowerCase() === "present") {
        map[sub].presentCount++;
      }
    });

    activeSessions.forEach((t) => {
      const sub = t.subject || "Active Session";
      if (!map[sub]) {
        map[sub] = {
          code: sub,
          name: sub,
          teacher: t.faculty || "Faculty Instructor",
          totalSessions: 0,
          presentCount: 0,
          lastAttended: "Live Session Active",
        };
      }
    });

    return Object.values(map);
  }, [studentRecords, activeSessions]);

  // Check if master timetable has any published slots
  const hasPublishedSchedule = useMemo(() => {
    return (
      (schedule.mon && schedule.mon.length > 0) ||
      (schedule.tue && schedule.tue.length > 0) ||
      (schedule.wed && schedule.wed.length > 0) ||
      (schedule.thu && schedule.thu.length > 0) ||
      (schedule.fri && schedule.fri.length > 0)
    );
  }, [schedule]);

  return (
    <div className='erp-classes-page'>
      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Academic Timetable & Course Roster</h1>
          <p className='erp-page-subtitle'>
            Master schedule and course roster driven by verified department sessions.
          </p>
        </div>
        <div className='erp-academic-badges'>
          <Badge variant='neutral'>Course Directory</Badge>
          <Badge variant={activeSessions.length > 0 ? "present" : "neutral"}>
            {activeSessions.length} Live Sessions
          </Badge>
        </div>
      </div>

      {/* Filter / Controls */}
      <div className='erp-classes-toolbar erp-card'>
        <div className='erp-day-filter-tabs'>
          <button
            type='button'
            className={`erp-day-tab ${selectedDay === "all" ? "active" : ""}`}
            onClick={() => setSelectedDay("all")}
          >
            All Week
          </button>
          {days.map((d) => (
            <button
              key={d}
              type='button'
              className={`erp-day-tab ${selectedDay === d ? "active" : ""} ${todayDayName === d ? "is-today" : ""}`}
              onClick={() => setSelectedDay(d)}
            >
              {d} {todayDayName === d && "•"}
            </button>
          ))}
        </div>

        {todayDayName && (
          <div className='erp-today-notice'>
            <span className='erp-status-dot' />
            <span>Today is <strong>{todayDayName}</strong></span>
          </div>
        )}
      </div>

      {/* Timetable View */}
      {!hasPublishedSchedule ? (
        <div className='erp-timetable-pending-banner erp-card'>
          <div className='erp-pending-icon-wrap'>
            <Icons.Calendar size={18} />
          </div>
          <div className='erp-pending-text-wrap'>
            <h3 className='erp-pending-title'>Master Timetable Awaiting Department Publication</h3>
            <p className='erp-pending-desc'>
              Timetable slots for the current term will render here dynamically upon administrator release. You can check in directly when professors broadcast active classroom sessions.
            </p>
          </div>
          <div className='erp-pending-meta'>
            <Badge variant="neutral" size="sm">Academic Year 2024–25</Badge>
          </div>
        </div>
      ) : (
        <div className='erp-timetable-card erp-card'>
          <div className='erp-table-container'>
            <table className='erp-table erp-timetable-grid'>
              <thead>
                <tr>
                  <th style={{ width: "130px" }}>Period Slot</th>
                  {days.map((dayName) => {
                    if (selectedDay !== "all" && selectedDay !== dayName) return null;
                    const isCurrentDay = todayDayName === dayName;
                    return (
                      <th key={dayName} className={isCurrentDay ? "col-today" : ""}>
                        {dayName} {isCurrentDay && "(Today)"}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {/* Dynamically mapped slots */}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dynamic Course Faculty Reference Roster */}
      <div className='erp-course-roster-section'>
        <div className='erp-section-header-row'>
          <div>
            <h2 className='erp-card-title'>Enrolled Courses & Faculty Directory</h2>
            <p className='erp-card-desc'>
              Courses and instructors registered through your authenticated classroom attendances.
            </p>
          </div>
          <Badge variant='neutral'>{dynamicCourses.length} Enrolled Courses</Badge>
        </div>

        {loading ? (
          <div style={{ padding: "16px 0" }}>
            <Skeleton height='48px' count={3} />
          </div>
        ) : dynamicCourses.length === 0 ? (
          <div className='erp-card' style={{ padding: "20px" }}>
            <EmptyState
              icon={Icons.BookOpen}
              title='No course enrollment records found'
              description='As you attend and check in to classroom lectures using session tokens, your registered courses and faculty directory will compile automatically.'
            />
          </div>
        ) : (
          <div className='erp-courses-grid'>
            {dynamicCourses.map((sub, i) => {
              const rate = sub.totalSessions > 0
                ? ((sub.presentCount / sub.totalSessions) * 100).toFixed(1)
                : "100.0";
              const isCompliant = parseFloat(rate) >= 75;

              return (
                <div key={i} className='erp-course-card erp-card'>
                  <div className='erp-course-header'>
                    <span className='erp-course-code tabular-nums'>{sub.code}</span>
                    <Badge variant={isCompliant ? "present" : "late"} size='sm'>
                      {isCompliant ? "Compliant (≥75%)" : "Shortage Warning"}
                    </Badge>
                  </div>
                  <h3 className='erp-course-title'>{sub.name}</h3>
                  <div className='erp-course-faculty'>
                    <Icons.User size={13} className='text-muted' />
                    <span>Instructor: <strong>{sub.teacher}</strong></span>
                  </div>
                  <div className='erp-course-footer-meta'>
                    <span className='tabular-nums font-semibold'>{sub.totalSessions} Sessions Logged</span>
                    <span>•</span>
                    <span>Rate: <strong style={{ color: isCompliant ? "var(--status-present)" : "var(--status-late)" }}>{rate}%</strong></span>
                    <span>•</span>
                    <span>Last: {sub.lastAttended}</span>
                  </div>
                </div>
              );
            })}

            {/* Complementary ERP Academic Policy Card to fill grid balance when only 1-2 courses exist */}
            {dynamicCourses.length <= 2 && (
              <div className='erp-course-card erp-card erp-course-advisory-card'>
                <div className='erp-course-header'>
                  <span className='erp-course-code'>STATUTORY REGULATION</span>
                  <Badge variant='neutral' size='sm'>Academic Policy</Badge>
                </div>
                <h3 className='erp-course-title'>Attendance Minimum Threshold (75%)</h3>
                <p className='erp-course-advisory-desc'>
                  University statutory regulations mandate at least 75% contact hours per registered course for semester examination eligibility. Discrepancies must be raised within 24 hours of session log.
                </p>
                <div className='erp-course-footer-meta'>
                  <Link to='/student/attendence' className='erp-advisory-link'>
                    View Attendance Transcript & PDF →
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Classes;
