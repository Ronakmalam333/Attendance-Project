import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import "./home.css";
import Details from "./details/Details";
import Token from "./token/Token";
import { AuthContext } from "../../../context/AuthContext";
import axios from "../../../tokenManager";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import Skeleton from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";

function Home() {
  const { user } = useContext(AuthContext);
  const [allRecords, setAllRecords] = useState([]);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    rate: "0.0",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      try {
        setLoadingRecords(true);
        const [attRes, tokRes] = await Promise.all([
          axios.get("/attendance/student").catch(() => ({ data: [] })),
          axios.get("/tokens/active").catch(() => ({ data: [] })),
        ]);

        const records = attRes.data || [];
        const tokens = tokRes.data || [];

        if (isMounted) {
          setAllRecords(records);
          setRecentRecords(records.slice(0, 5));
          setActiveSessions(tokens);

          const total = records.length;
          const present = records.filter(
            (r) => (r.status || "").toLowerCase() === "present"
          ).length;
          const absent = records.filter(
            (r) => (r.status || "").toLowerCase() === "absent"
          ).length;
          const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";

          setAttendanceStats({ total, present, absent, rate });
        }
      } catch (err) {
        // Handled silently
      } finally {
        if (isMounted) setLoadingRecords(false);
      }
    };

    fetchHomeData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live course attendance health strictly from all real attendance records
  const dynamicCourses = useMemo(() => {
    if (!allRecords.length) return [];
    const map = {};
    allRecords.forEach((r) => {
      const sub = r.subject || "General Session";
      if (!map[sub]) {
        map[sub] = { code: sub, name: sub, teacher: r.faculty || "Faculty", held: 0, attended: 0 };
      }
      map[sub].held++;
      if ((r.status || "").toLowerCase() === "present") {
        map[sub].attended++;
      }
    });
    return Object.values(map);
  }, [allRecords]);

  return (
    <div className='home-contain'>
      {/* Top Row: Student Profile & Today's Schedule + Live Kiosk */}
      <div className='home'>
        <Details />
        <Token />
      </div>

      {/* Middle Row: Course-Wise Attendance Health & Live Broadcast Sessions */}
      <div className='erp-home-middle-grid'>
        {/* Dynamic Course-Wise Attendance Matrix */}
        <div className='erp-card erp-course-health-card'>
          <div className='erp-section-header-row'>
            <div>
              <h2 className='erp-card-title'>Course Attendance Health & Thresholds</h2>
              <p className='erp-card-desc'>
                Real-time subject attendance computed from your active verified classroom sessions.
              </p>
            </div>
            <Link to='/student/attendence' className='erp-btn erp-btn-secondary erp-btn-sm'>
              <Icons.FileText size={14} />
              <span>Full Log</span>
            </Link>
          </div>

          {loadingRecords ? (
            <div style={{ padding: "16px 0" }}>
              <Skeleton height='36px' count={3} />
            </div>
          ) : dynamicCourses.length === 0 ? (
            <EmptyState
              icon={Icons.BookOpen}
              title='No course attendance recorded yet'
              description='Your course-wise attendance bars, percentages, and exam eligibility standing will appear here as you verify classroom codes.'
            />
          ) : (
            <div className='erp-courses-health-container'>
              <div className='erp-courses-health-list'>
                {dynamicCourses.map((course) => {
                  const pct = ((course.attended / course.held) * 100).toFixed(1);
                  const numPct = parseFloat(pct);
                  const isCompliant = numPct >= 75;
                  const isBorderline = numPct >= 70 && numPct < 75;
                  const margin = Math.max(
                    0,
                    Math.floor((course.attended - 0.75 * course.held) / 0.75)
                  );

                  return (
                    <div key={course.code} className='erp-course-health-row'>
                      <div className='erp-course-info-col'>
                        <div className='erp-course-code-line'>
                          <span className='erp-course-code-badge'>{course.code}</span>
                          <span className='erp-course-full-name'>{course.name}</span>
                        </div>
                        <span className='erp-course-faculty-sub'>
                          Faculty: {course.teacher}
                        </span>
                      </div>

                      <div className='erp-course-progress-col'>
                        <div className='erp-course-pct-row'>
                          <span className='erp-course-held-text tabular-nums'>
                            {course.attended}/{course.held} Lectures Attended
                          </span>
                          <span
                            className={`erp-course-pct-label tabular-nums ${
                              isCompliant ? "text-good" : isBorderline ? "text-warn" : "text-danger"
                            }`}
                          >
                            {pct}%
                          </span>
                        </div>
                        <div className='erp-progress-track'>
                          <div
                            className={`erp-progress-fill ${
                              isCompliant ? "fill-good" : isBorderline ? "fill-warn" : "fill-danger"
                            }`}
                            style={{ width: `${Math.min(100, numPct)}%` }}
                          />
                        </div>
                      </div>

                      <div className='erp-course-status-col'>
                        <Badge
                          variant={isCompliant ? "present" : isBorderline ? "late" : "absent"}
                          size='sm'
                        >
                          {isCompliant ? "Exam Eligible" : isBorderline ? "Borderline" : "Below Cutoff"}
                        </Badge>
                        <span className='erp-course-margin-note'>
                          {isCompliant
                            ? `${margin} safe margin classes`
                            : "Attend next session mandatory"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Integrated ERP Telemetry Strip to fill and balance the card */}
              <div className='erp-academic-summary-bar'>
                <div className='erp-summary-metric'>
                  <span className='erp-summary-metric-label'>Registered Subjects</span>
                  <span className='erp-summary-metric-val tabular-nums'>{dynamicCourses.length}</span>
                </div>
                <div className='erp-summary-divider' />
                <div className='erp-summary-metric'>
                  <span className='erp-summary-metric-label'>Cumulative Attendance</span>
                  <span className='erp-summary-metric-val tabular-nums' style={{ color: "var(--status-present, #10b981)" }}>
                    {attendanceStats.rate}%
                  </span>
                </div>
                <div className='erp-summary-divider' />
                <div className='erp-summary-metric'>
                  <span className='erp-summary-metric-label'>Statutory Status</span>
                  <span className='erp-summary-metric-val' style={{ fontSize: "0.8125rem" }}>
                    {parseFloat(attendanceStats.rate) >= 75 ? "Compliant (≥75%)" : "Shortage Warning"}
                  </span>
                </div>
                <div className='erp-summary-divider' />
                <div className='erp-summary-metric'>
                  <span className='erp-summary-metric-label'>Audit Trail</span>
                  <span className='erp-summary-metric-val' style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    {allRecords.length} Verified Entries
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Broadcast Sessions & Telemetry Status */}
        <div className='erp-card erp-notices-card'>
          <div className='erp-section-header-row'>
            <div>
              <h2 className='erp-card-title'>Active Classroom Broadcasts</h2>
              <p className='erp-card-desc'>
                Live attendance sessions currently opened by faculty members.
              </p>
            </div>
            <Badge variant={activeSessions.length > 0 ? "present" : "neutral"} size='sm'>
              {activeSessions.length} Active
            </Badge>
          </div>

          {activeSessions.length === 0 ? (
            <div className='erp-empty-broadcast-state'>
              <Icons.Clock size={18} className='text-muted' />
              <div>
                <p className='erp-empty-broadcast-title'>No active classroom broadcasts</p>
                <p className='erp-empty-broadcast-sub'>
                  Instructors open session windows when lecture begins. They will appear here in real time.
                </p>
              </div>
            </div>
          ) : (
            <div className='erp-notices-list'>
              {activeSessions.map((session, idx) => (
                <div key={session._id || idx} className='erp-notice-item'>
                  <div className='erp-notice-top'>
                    <span className='erp-notice-tag'>
                      {session.subject}
                    </span>
                    <span className='erp-notice-date'>
                      Valid Until: {new Date(session.validUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <h3 className='erp-notice-title'>Faculty: {session.faculty || "Faculty Instructor"}</h3>
                  <p className='erp-notice-desc'>
                    Submissions accepted: {session.currentUsage || 0} / {session.maxUsage} students checked in.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;
