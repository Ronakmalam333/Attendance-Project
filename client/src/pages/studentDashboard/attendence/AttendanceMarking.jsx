import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "../../../tokenManager";
import { useToast } from "../../../context/ToastContext";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import Skeleton from "../../../components/ui/Skeleton";
import "./attendanceMarking.css";

const protocolRules = [
  {
    icon: Icons.Clock,
    title: "1. Ephemeral 10-Minute Tokens",
    desc: "Session tokens are generated dynamically by faculty in the classroom and auto-expire within 10 to 15 minutes of lecture commencement.",
  },
  {
    icon: Icons.Shield,
    title: "2. Authenticated UID Binding",
    desc: "Each check-in submission is cryptographically tied to your active student session and University Roll Number to prevent proxy logging.",
  },
  {
    icon: Icons.CheckSquare,
    title: "3. Single Submission Per Slot",
    desc: "Once verified, an attendance receipt is finalized for the period slot. Duplicate submissions for the same session window are rejected.",
  },
  {
    icon: Icons.Info,
    title: "4. 24-Hour Discrepancy Policy",
    desc: "If campus Wi-Fi or technical failure prevents token entry, notify your professor or file a discrepancy ticket through the student portal within 24 hours.",
  },
];

function AttendanceMarking() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTokens, setActiveTokens] = useState([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [todayReceipts, setTodayReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchActiveTokens();
    fetchStudentReceipts();
    const interval = setInterval(fetchActiveTokens, 25000);
    return () => clearInterval(interval);
  }, []);

  const fetchActiveTokens = async () => {
    try {
      setLoadingTokens(true);
      const response = await axios.get("/tokens/active");
      setActiveTokens(response.data || []);
    } catch (error) {
      setActiveTokens([]);
    } finally {
      setLoadingTokens(false);
    }
  };

  const fetchStudentReceipts = async () => {
    try {
      setLoadingReceipts(true);
      const response = await axios.get("/attendance/student");
      const records = response.data || [];
      // Take last 5 records
      setTodayReceipts(records.slice(0, 5));
    } catch (error) {
      setTodayReceipts([]);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const cleanToken = token.trim().toUpperCase();
    if (!cleanToken || cleanToken.length !== 4) {
      toast.warning("Please enter a valid 4-character token", "Invalid Input");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("/attendance/submit", {
        token: cleanToken,
        subject: "AUTO_DETECT",
      });

      toast.success(response.data.message || "Attendance recorded successfully!", "Check-In Confirmed");
      setToken("");
      fetchActiveTokens();
      fetchStudentReceipts();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to submit attendance. Check token code or expiration.";
      toast.error(errorMessage, "Submission Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleTokenInput = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    setToken(value);
  };

  const handleQuickCheckin = (tokenValue) => {
    setToken(tokenValue);
    (async () => {
      setLoading(true);
      try {
        const response = await axios.post("/attendance/submit", {
          token: tokenValue,
          subject: "AUTO_DETECT",
        });
        toast.success(response.data.message || "Attendance marked!", "Check-In Confirmed");
        setToken("");
        fetchActiveTokens();
        fetchStudentReceipts();
      } catch (err) {
        toast.error(err.response?.data?.message || "Check-in failed.", "Failed");
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className='erp-marking-page'>
      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Attendance Check-in Station</h1>
          <p className='erp-page-subtitle'>
            Validate and register your classroom presence securely via session tokens.
          </p>
        </div>
        <button
          type='button'
          className='erp-btn erp-btn-secondary'
          onClick={() => {
            fetchActiveTokens();
            fetchStudentReceipts();
          }}
          disabled={loadingTokens}
        >
          <Icons.Refresh size={14} />
          <span>Refresh Sessions</span>
        </button>
      </div>

      {/* Main Kiosk Grid */}
      <div className='erp-marking-grid'>
        {/* Token Input Form Card */}
        <div className='erp-marking-form-card erp-card'>
          <div className='erp-card-heading-block'>
            <div className='erp-card-icon-pill'>
              <Icons.Key size={16} />
            </div>
            <div>
              <h2 className='erp-card-title'>Enter Session Code</h2>
              <p className='erp-card-desc'>Type the 4-digit token provided by your professor.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='erp-kiosk-form'>
            <div className='erp-kiosk-input-container'>
              <label htmlFor='token' className='erp-label'>
                Session Code (4 Digits)
              </label>
              <input
                id='token'
                type='text'
                value={token}
                onChange={handleTokenInput}
                placeholder='••••'
                maxLength={4}
                className='erp-kiosk-token-input tabular-nums'
                disabled={loading}
                autoComplete='off'
                autoFocus
              />
            </div>

            <button
              type='submit'
              className='erp-btn erp-btn-primary erp-kiosk-submit-btn'
              disabled={loading || token.length !== 4}
            >
              {loading ? (
                <>
                  <span className='erp-spinner-sm' />
                  <span>Submitting Verification...</span>
                </>
              ) : (
                <>
                  <Icons.CheckCircle size={15} />
                  <span>Verify & Submit Attendance</span>
                </>
              )}
            </button>
          </form>

          <div className='erp-kiosk-security-note'>
            <Icons.Shield size={13} />
            <span>Attendance submissions are timestamped and tied to your registered UID.</span>
          </div>
        </div>

        {/* Broadcasted Active Sessions List */}
        <div className='erp-marking-sessions-card erp-card'>
          <div className='erp-card-heading-block'>
            <div className='erp-card-icon-pill' style={{ color: "var(--status-present, #10b981)" }}>
              <Icons.Clock size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 className='erp-card-title'>Active Classroom Broadcasts</h2>
                <Badge variant={activeTokens.length > 0 ? "present" : "neutral"} size='sm'>
                  {activeTokens.length} Active
                </Badge>
              </div>
              <p className='erp-card-desc'>Sessions currently open for student attendance submission.</p>
            </div>
          </div>

          <div className='erp-sessions-container'>
            {loadingTokens && activeTokens.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                Scanning active classroom tokens...
              </div>
            ) : activeTokens.length === 0 ? (
              <div className='erp-kiosk-empty-broadcasts'>
                <div className='erp-kiosk-empty-icon'>
                  <Icons.Clock size={20} />
                </div>
                <div className='erp-kiosk-empty-text'>
                  <h4>No Active Broadcast Sessions Right Now</h4>
                  <p>Your instructor has not opened an attendance window for this slot. Check again when lecture begins.</p>
                </div>
                <div className='erp-kiosk-empty-status'>
                  <span className='erp-status-dot' />
                  <span>Institutional gateway listening for token broadcast...</span>
                </div>
              </div>
            ) : (
              <div className='erp-sessions-kiosk-list'>
                {activeTokens.map((tokenData) => {
                  const validDate = new Date(tokenData.validUntil);
                  const validTime = validDate.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div key={tokenData._id || tokenData.token} className='erp-session-kiosk-row'>
                      <div className='erp-session-kiosk-meta'>
                        <div className='erp-session-subject-title'>
                          <strong>{tokenData.subject}</strong>
                          <span className='erp-faculty-badge'>Faculty: {tokenData.faculty || "Staff"}</span>
                        </div>
                        <div className='erp-session-stats-sub'>
                          <span>Valid Until: <strong>{validTime}</strong></span>
                          <span>•</span>
                          <span>Check-ins: <strong>{tokenData.currentUsage || 0} / {tokenData.maxUsage}</strong></span>
                        </div>
                      </div>

                      {tokenData.token && (
                        <button
                          type='button'
                          className='erp-btn erp-btn-secondary erp-btn-instant-mark'
                          onClick={() => handleQuickCheckin(tokenData.token)}
                          disabled={loading}
                        >
                          <Icons.Key size={13} />
                          <span>Check In: {tokenData.token}</span>
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle Row: Today's Verified Check-in Activity & Proof of Attendance */}
      <div className='erp-card erp-today-receipts-card'>
        <div className='erp-section-header-row'>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.CheckSquare size={16} className='text-secondary' />
              <h2 className='erp-card-title'>Recent Verified Check-in Receipts</h2>
            </div>
            <p className='erp-card-desc'>
              Tamper-evident log of attendance submissions registered from your authenticated account.
            </p>
          </div>
          <Link to='/student/attendence' className='erp-btn erp-btn-secondary erp-btn-sm'>
            <Icons.Download size={14} />
            <span>Official Attendance PDF</span>
          </Link>
        </div>

        {loadingReceipts ? (
          <div style={{ padding: "16px 0" }}>
            <Skeleton height='36px' count={3} />
          </div>
        ) : todayReceipts.length === 0 ? (
          <div className='erp-receipts-empty-notice'>
            <Icons.Clock size={18} className='text-muted' />
            <span>No check-ins recorded yet for today. Use the session code form above when lecture begins.</span>
          </div>
        ) : (
          <div className='erp-table-container'>
            <table className='erp-table'>
              <thead>
                <tr>
                  <th>Session Date</th>
                  <th>Course Name</th>
                  <th>Faculty In-Charge</th>
                  <th>Logged Time</th>
                  <th>Verification Status</th>
                  <th>Audit Reference</th>
                </tr>
              </thead>
              <tbody>
                {todayReceipts.map((rec, idx) => {
                  const d = rec.date ? new Date(rec.date).toISOString().split("T")[0] : "Today";
                  const statusVariant =
                    (rec.status || "").toLowerCase() === "present"
                      ? "present"
                      : (rec.status || "").toLowerCase() === "absent"
                      ? "absent"
                      : "late";

                  return (
                    <tr key={rec._id || idx}>
                      <td className='tabular-nums font-medium'>{d}</td>
                      <td className='font-semibold'>{rec.subject || "Lecture Session"}</td>
                      <td className='text-muted'>{rec.faculty || "Faculty"}</td>
                      <td className='tabular-nums'>{rec.time || "N/A"}</td>
                      <td>
                        <Badge variant={statusVariant} size='sm'>
                          {rec.status || "Present"}
                        </Badge>
                      </td>
                      <td className='tabular-nums text-muted'>
                        <span className='erp-receipt-audit-tag'>
                          {rec._id ? String(rec._id).slice(-8).toUpperCase() : `AUTH-${idx + 1}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Row: Attendance Conduct Protocol & Guidelines */}
      <div className='erp-card erp-guidelines-card'>
        <div className='erp-section-header-row'>
          <div>
            <h2 className='erp-card-title'>Institutional Check-in Protocol & Guidelines</h2>
            <p className='erp-card-desc'>
              Mandatory standards governing classroom attendance capture and verification integrity.
            </p>
          </div>
          <Badge variant='neutral'>Academic Regulations</Badge>
        </div>

        <div className='erp-protocol-grid'>
          {protocolRules.map((rule, idx) => {
            const IconComp = rule.icon;
            return (
              <div key={idx} className='erp-protocol-item'>
                <div className='erp-protocol-icon'>
                  <IconComp size={16} />
                </div>
                <div>
                  <h3 className='erp-protocol-title'>{rule.title}</h3>
                  <p className='erp-protocol-desc'>{rule.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Grievance Desk Bar */}
        <div className='erp-grievance-banner'>
          <div className='erp-grievance-content'>
            <Icons.Info size={16} className='text-secondary' />
            <div>
              <strong>Encountered a Check-in Glitch or Connectivity Timeout?</strong>
              <p>
                Faculty members can manually review classroom logs. For system disputes, contact the Academic Office within 24 hours.
              </p>
            </div>
          </div>
          <Link to='/student/feedback' className='erp-btn erp-btn-secondary erp-btn-sm'>
            Submit Grievance
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AttendanceMarking;
