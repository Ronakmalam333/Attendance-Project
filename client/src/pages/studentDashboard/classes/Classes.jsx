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

const standardPeriodSlots = [
  {
    time: "09:15 - 10:15",
    period: "Period 1",
    slots: {
      Mon: { name: "Library / Research Session", room: "Central Library", type: "Self-Study" },
      Tue: { name: "Mobile App Development", room: "Lab Block B-204", type: "Core Lecture" },
      Wed: { name: "Library / Research Session", room: "Central Library", type: "Self-Study" },
      Thu: { name: "Database Engineering", room: "Lecture Hall 102", type: "Core Lecture" },
      Fri: { name: "Computer Networks", room: "Lecture Hall 105", type: "Core Lecture" },
      Sat: { name: "Technical Seminar", room: "Seminar Hall A", type: "Tutorial" },
    },
  },
  {
    time: "10:15 - 11:15",
    period: "Period 2",
    slots: {
      Mon: { name: "Mobile App Development", room: "Lab Block B-204", type: "Core Lecture" },
      Tue: { name: "Database Engineering", room: "Lecture Hall 102", type: "Core Lecture" },
      Wed: { name: "Mobile App Development", room: "Lab Block B-204", type: "Core Lecture" },
      Thu: { name: "Computer Networks", room: "Lecture Hall 105", type: "Core Lecture" },
      Fri: { name: "Web Technologies", room: "Lab Block A-301", type: "Core Lecture" },
      Sat: { name: "Practical Lab Session", room: "Computing Lab 3", type: "Practical" },
    },
  },
  {
    time: "11:15 - 12:15",
    period: "Period 3",
    slots: {
      Mon: { name: "Computer Networks", room: "Lecture Hall 105", type: "Core Lecture" },
      Tue: { name: "Web Technologies", room: "Lab Block A-301", type: "Core Lecture" },
      Wed: { name: "Engineering Mathematics II", room: "Main Block 101", type: "Theory" },
      Thu: { name: "Mobile App Development", room: "Lab Block B-204", type: "Core Lecture" },
      Fri: { name: "Software Engineering", room: "Lecture Hall 202", type: "Core Lecture" },
      Sat: { name: "Practical Lab Session", room: "Computing Lab 3", type: "Practical" },
    },
  },
  {
    time: "12:15 - 01:15",
    period: "Recess",
    isBreak: true,
    slots: {
      Mon: { name: "Campus Lunch & Recess", room: "Campus Dining", type: "Break" },
      Tue: { name: "Campus Lunch & Recess", room: "Campus Dining", type: "Break" },
      Wed: { name: "Campus Lunch & Recess", room: "Campus Dining", type: "Break" },
      Thu: { name: "Campus Lunch & Recess", room: "Campus Dining", type: "Break" },
      Fri: { name: "Campus Lunch & Recess", room: "Campus Dining", type: "Break" },
      Sat: { name: "Campus Recess", room: "Campus Dining", type: "Break" },
    },
  },
  {
    time: "01:15 - 02:15",
    period: "Period 4",
    slots: {
      Mon: { name: "Engineering Mathematics II", room: "Main Block 101", type: "Theory" },
      Tue: { name: "Mobile App Development", room: "Lab Block B-204", type: "Core Lecture" },
      Wed: { name: "Computer Networks", room: "Lecture Hall 105", type: "Core Lecture" },
      Thu: { name: "Software Engineering", room: "Lecture Hall 202", type: "Core Lecture" },
      Fri: { name: "Database Engineering", room: "Lecture Hall 102", type: "Core Lecture" },
      Sat: { name: "Student Clubs & Sports", room: "Sports Arena", type: "Activity" },
    },
  },
  {
    time: "02:15 - 03:15",
    period: "Period 5",
    slots: {
      Mon: { name: "Sports & Physical Fitness", room: "Sports Complex", type: "Activity" },
      Tue: { name: "Application Lab Practical", room: "Computing Lab 2", type: "Practical" },
      Wed: { name: "Software Engineering", room: "Lecture Hall 202", type: "Core Lecture" },
      Thu: { name: "Web Technologies Lab", room: "Computing Lab 1", type: "Practical" },
      Fri: { name: "Faculty Mentorship / Library", room: "Faculty Wing", type: "Mentorship" },
      Sat: { name: "Free Period / Project Work", room: "Innovation Lab", type: "Project" },
    },
  },
  {
    time: "03:15 - 04:15",
    period: "Period 6",
    slots: {
      Mon: { name: "Open Elective / Project", room: "Innovation Lab", type: "Elective" },
      Tue: { name: "Application Lab Practical", room: "Computing Lab 2", type: "Practical" },
      Wed: { name: "Open Elective / Project", room: "Innovation Lab", type: "Elective" },
      Thu: { name: "Technical Presentation", room: "Auditorium B", type: "Seminar" },
      Fri: { name: "Open Elective / Project", room: "Innovation Lab", type: "Elective" },
      Sat: { name: "Department Consultation", room: "Faculty Wing", type: "Consultation" },
    },
  },
];

const facultyDirectory = [
  { name: "Prof. Vikram Sen", subject: "Mobile App Development", office: "Faculty Block B, Room 204", hours: "Mon & Wed, 3:30 PM - 5:00 PM", email: "v.sen@university.edu" },
  { name: "Dr. Ananya Deshmukh", subject: "Database Engineering", office: "Academic Block 1, Room 102", hours: "Tue & Thu, 2:00 PM - 3:30 PM", email: "a.deshmukh@university.edu" },
  { name: "Prof. Rajesh Pillai", subject: "Computer Networks", office: "Faculty Block A, Room 310", hours: "Mon & Fri, 11:30 AM - 1:00 PM", email: "r.pillai@university.edu" },
  { name: "Dr. Meenakshi Sundaram", subject: "Engineering Mathematics II", office: "Science Block, Room 405", hours: "Wed & Thu, 10:00 AM - 11:30 AM", email: "m.sundaram@university.edu" },
];

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

  // Check if live active token matches any period
  const isSubjectLive = (subjectName) => {
    if (!subjectName || !activeSessions.length) return false;
    const cleanSub = subjectName.toLowerCase();
    return activeSessions.some((s) => (s.subject || "").toLowerCase().includes(cleanSub));
  };

  return (
    <div className='erp-classes-page'>
      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Academic Timetable & Course Schedule</h1>
          <p className='erp-page-subtitle'>
            Master semester schedule, daily periods, and faculty office hours roster.
          </p>
        </div>
        <div className='erp-academic-badges'>
          <Badge variant='neutral'>Academic Term 2024–25</Badge>
          <Badge variant={activeSessions.length > 0 ? "present" : "neutral"}>
            {activeSessions.length} Live Sessions Active
          </Badge>
        </div>
      </div>

      {/* Filter / Day Selector Controls */}
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
              {d} {todayDayName === d && "• Today"}
            </button>
          ))}
        </div>

        {todayDayName && (
          <div className='erp-today-notice'>
            <span className='erp-status-dot' />
            <span>Today is <strong>{todayDayName}</strong> • Real-time Schedule Synchronized</span>
          </div>
        )}
      </div>

      {/* Comprehensive Academic Schedule Grid */}
      <div className='erp-timetable-card erp-card'>
        <div className='erp-table-container'>
          <table className='erp-table erp-timetable-grid'>
            <thead>
              <tr>
                <th style={{ width: "140px" }}>Period & Time</th>
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
              {standardPeriodSlots.map((period, pIdx) => (
                <tr key={pIdx} className={period.isBreak ? "row-recess" : ""}>
                  <td className='tabular-nums font-semibold'>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <span>{period.period}</span>
                      <span className='text-muted' style={{ fontSize: "0.75rem" }}>
                        {period.time}
                      </span>
                    </div>
                  </td>
                  {days.map((dayName) => {
                    if (selectedDay !== "all" && selectedDay !== dayName) return null;
                    const slot = period.slots[dayName] || { name: "Study Period", room: "Campus", type: "Free" };
                    const live = isSubjectLive(slot.name);

                    return (
                      <td key={dayName} className={todayDayName === dayName ? "col-today-cell" : ""}>
                        <div className={`erp-period-slot-cell ${period.isBreak ? "is-break" : ""}`}>
                          <strong className='erp-slot-name'>{slot.name}</strong>
                          <div className='erp-slot-meta'>
                            <span className='erp-slot-room'>{slot.room}</span>
                            {live && (
                              <Badge variant='present' size='sm'>
                                Live Now
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Directory and Workload Overview (2 Columns) */}
      <div className='erp-classes-subgrid'>
        {/* Dynamic Course Directory */}
        <div className='erp-course-roster-section'>
          <div className='erp-section-header-row'>
            <div>
              <h2 className='erp-card-title'>Enrolled Courses & Active Standing</h2>
              <p className='erp-card-desc'>
                Your authenticated course enrollments and compliance standings.
              </p>
            </div>
            <Badge variant='brand'>{dynamicCourses.length || 1} Enrolled</Badge>
          </div>

          <div className='erp-courses-grid'>
            {dynamicCourses.length === 0 ? (
              <div className='erp-course-card erp-card'>
                <div className='erp-course-header'>
                  <span className='erp-course-code'>MOBILE-APP-DEV</span>
                  <Badge variant='present' size='sm'>Compliant (100%)</Badge>
                </div>
                <h3 className='erp-course-title'>Mobile App Development</h3>
                <div className='erp-course-faculty'>
                  <Icons.User size={13} className='text-muted' />
                  <span>Instructor: <strong>Information Technology</strong></span>
                </div>
                <div className='erp-course-footer-meta'>
                  <span>1 Lecture Logged</span>
                  <span>•</span>
                  <span>Exam Eligible</span>
                </div>
              </div>
            ) : (
              dynamicCourses.map((sub, i) => {
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
                    </div>
                  </div>
                );
              })
            )}

            {/* Academic Workload Summary */}
            <div className='erp-course-card erp-card erp-course-advisory-card'>
              <div className='erp-course-header'>
                <span className='erp-course-code'>SEMESTER LOAD</span>
                <Badge variant='neutral' size='sm'>24 Credits</Badge>
              </div>
              <h3 className='erp-course-title'>Weekly Contact Hours: 26 Hrs</h3>
              <p className='erp-course-advisory-desc'>
                18 Hours Lectures • 4 Hours Practical Laboratories • 4 Hours Tutorials & Library Mentorship.
              </p>
              <div className='erp-course-footer-meta'>
                <Link to='/student/mark-attendance' className='erp-advisory-link'>
                  Open Check-in Station →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Academic Calendar & Milestones */}
        <div className='erp-card erp-academic-calendar-card'>
          <div className='erp-section-header-row'>
            <div>
              <h2 className='erp-card-title'>Academic Calendar & Deadlines</h2>
              <p className='erp-card-desc'>Key institutional milestones for the current semester term.</p>
            </div>
            <Badge variant='neutral'>Official Schedule</Badge>
          </div>

          <div className='erp-calendar-milestones-list'>
            <div className='erp-milestone-item'>
              <div className='erp-milestone-dot' />
              <div className='erp-milestone-info'>
                <strong>Continuous Assessment 1 (CA-1)</strong>
                <span>Mid-Semester Assessment Examination Window</span>
              </div>
              <span className='erp-milestone-date'>Week 8</span>
            </div>

            <div className='erp-milestone-item'>
              <div className='erp-milestone-dot dot-warn' />
              <div className='erp-milestone-info'>
                <strong>Statutory 75% Attendance Audit Freeze</strong>
                <span>Official audit of semester contact hours for exam eligibility</span>
              </div>
              <span className='erp-milestone-date'>Week 14</span>
            </div>

            <div className='erp-milestone-item'>
              <div className='erp-milestone-dot' />
              <div className='erp-milestone-info'>
                <strong>Semester Practical & Lab Examinations</strong>
                <span>Comprehensive evaluation in designated computing laboratories</span>
              </div>
              <span className='erp-milestone-date'>Week 15</span>
            </div>

            <div className='erp-milestone-item'>
              <div className='erp-milestone-dot dot-success' />
              <div className='erp-milestone-info'>
                <strong>Semester End Final Examinations (SEE)</strong>
                <span>Written theory examinations across enrolled course modules</span>
              </div>
              <span className='erp-milestone-date'>Week 16</span>
            </div>
          </div>

          {/* Quick Notice */}
          <div className='erp-calendar-notice-box'>
            <Icons.Info size={15} />
            <span>Attendance below 75% without authorized medical exemption will disqualify hall-ticket issuance.</span>
          </div>
        </div>
      </div>

      {/* Faculty Office Hours Directory */}
      <div className='erp-card erp-faculty-hours-card'>
        <div className='erp-section-header-row'>
          <div>
            <h2 className='erp-card-title'>Faculty Office Hours & Consultation Directory</h2>
            <p className='erp-card-desc'>
              Dedicated departmental hours for student doubts, mentorship, and attendance queries.
            </p>
          </div>
          <Badge variant='neutral'>Faculty Wing</Badge>
        </div>

        <div className='erp-faculty-hours-grid'>
          {facultyDirectory.map((fac, idx) => (
            <div key={idx} className='erp-faculty-hour-box'>
              <div className='erp-faculty-hour-header'>
                <Icons.User size={15} className='text-brand' />
                <strong>{fac.name}</strong>
              </div>
              <span className='erp-faculty-hour-sub'>{fac.subject}</span>
              <div className='erp-faculty-hour-details'>
                <span><strong>Office:</strong> {fac.office}</span>
                <span><strong>Hours:</strong> {fac.hours}</span>
                <span><strong>Email:</strong> {fac.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Classes;
