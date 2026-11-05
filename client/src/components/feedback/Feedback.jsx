import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import api from "../../tokenManager";
import { useToast } from "../../context/ToastContext";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";
import EmptyState from "../ui/EmptyState";
import "./feedback.css";

const grievanceSteps = [
  {
    step: "1. Ticket Ingestion",
    desc: "Your observation is categorized and logged in the Academic Quality & Operations registry.",
  },
  {
    step: "2. Faculty & Admin Review",
    desc: "For check-in or token discrepancies, course faculty and department leads inspect session timestamps.",
  },
  {
    step: "3. Resolution SLA (48h)",
    desc: "Official remarks and attendance ledger corrections are processed within two university working days.",
  },
];

const categoryLabels = {
  general: "General Usability",
  tokens: "Token Check-in & Speed",
  timetable: "Timetable & Schedule",
  "attendance-discrepancy": "Attendance Discrepancy",
  feature: "Feature Request",
  bug: "Technical Bug / Issue",
};

function Feedback() {
  const location = useLocation();
  const isStaff =
    location.pathname.startsWith("/staff") ||
    localStorage.getItem("role") === "staff";

  // Tab State
  // For students: "submit" | "my-tickets"
  // For staff: "console" | "submit"
  const [activeTab, setActiveTab] = useState(isStaff ? "console" : "submit");

  // Form State
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("general");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student Tickets State
  const [myTickets, setMyTickets] = useState([]);
  const [loadingMyTickets, setLoadingMyTickets] = useState(false);

  // Staff Console State
  const [allTickets, setAllTickets] = useState([]);
  const [loadingAllTickets, setLoadingAllTickets] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Resolution Modal State (Staff)
  const [resolvingTicket, setResolvingTicket] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("resolved");
  const [responseComment, setResponseComment] = useState("");
  const [isSavingResolution, setIsSavingResolution] = useState(false);

  const toast = useToast();

  // Fetch student's own tickets
  const fetchMyTickets = useCallback(async () => {
    setLoadingMyTickets(true);
    try {
      const response = await api.get("/feedback/my");
      setMyTickets(response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load your submitted tickets.");
    } finally {
      setLoadingMyTickets(false);
    }
  }, [toast]);

  // Fetch all tickets for staff
  const fetchAllTickets = useCallback(async () => {
    setLoadingAllTickets(true);
    try {
      const response = await api.get("/feedback", {
        params: {
          status: statusFilter,
          category: categoryFilter,
          search: searchQuery.trim() || undefined,
        },
      });
      setAllTickets(response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch campus feedback tickets.");
    } finally {
      setLoadingAllTickets(false);
    }
  }, [statusFilter, categoryFilter, searchQuery, toast]);

  // Initial load according to role & tab
  useEffect(() => {
    if (isStaff && activeTab === "console") {
      fetchAllTickets();
    } else if (!isStaff && activeTab === "my-tickets") {
      fetchMyTickets();
    }
  }, [isStaff, activeTab, fetchAllTickets, fetchMyTickets]);

  // Submit Feedback Handler (Shared by student and staff)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.warning("Please enter your comments or discrepancy details.", "Description Required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post("/feedback", {
        category,
        rating: Number(rating),
        comment: comment.trim(),
      });

      toast.success(
        response.data?.message || "Feedback submitted and logged into the review system.",
        "Submission Received"
      );
      setRating(5);
      setComment("");

      // Switch to tracking tab to see newly submitted ticket
      if (!isStaff) {
        setActiveTab("my-tickets");
        fetchMyTickets();
      } else {
        fetchAllTickets();
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit feedback. Please check connection and try again.",
        "Submission Failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Student Withdraw Ticket
  const handleWithdrawTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to withdraw this ticket?")) return;

    try {
      await api.delete(`/feedback/my/${ticketId}`);
      toast.success("Ticket withdrawn successfully.", "Ticket Closed");
      setMyTickets((prev) => prev.filter((t) => t._id !== ticketId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to withdraw ticket.");
    }
  };

  // Staff Open Resolution Modal
  const handleOpenResolutionModal = (ticket) => {
    setResolvingTicket(ticket);
    setResolutionStatus(ticket.status === "pending" ? "reviewed" : ticket.status);
    setResponseComment(ticket.responseComment || "");
  };

  // Staff Submit Resolution & Remark
  const handleSaveResolution = async (e) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    setIsSavingResolution(true);
    try {
      const res = await api.patch(`/feedback/${resolvingTicket._id}/status`, {
        status: resolutionStatus,
        responseComment: responseComment.trim(),
      });

      toast.success(res.data?.message || "Ticket status and remarks updated.", "Ticket Updated");

      // Update in state
      setAllTickets((prev) =>
        prev.map((t) => (t._id === resolvingTicket._id ? res.data.feedback : t))
      );
      setResolvingTicket(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update ticket status.");
    } finally {
      setIsSavingResolution(false);
    }
  };

  // Staff Delete Ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Permanently delete this feedback ticket from records?")) return;

    try {
      await api.delete(`/feedback/${ticketId}`);
      toast.success("Ticket deleted from grievance records.", "Record Deleted");
      setAllTickets((prev) => prev.filter((t) => t._id !== ticketId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete ticket.");
    }
  };

  // Summary Metrics (for staff console)
  const metrics = useMemo(() => {
    const total = allTickets.length;
    const pending = allTickets.filter((t) => t.status === "pending").length;
    const reviewed = allTickets.filter((t) => t.status === "reviewed").length;
    const resolved = allTickets.filter((t) => t.status === "resolved").length;
    return { total, pending, reviewed, resolved };
  }, [allTickets]);

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <Badge variant='present'>Resolved</Badge>;
      case "reviewed":
        return <Badge variant='brand'>In Review</Badge>;
      case "pending":
      default:
        return <Badge variant='late'>Pending Review</Badge>;
    }
  };

  return (
    <div className='erp-feedback-page'>
      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>
            {isStaff ? "Institutional Grievance & Feedback Console" : "System & Campus Feedback Desk"}
          </h1>
          <p className='erp-page-subtitle'>
            {isStaff
              ? "Monitor student attendance discrepancy tickets, evaluate operational feedback, and publish official faculty remarks."
              : "Submit observation tickets, report classroom check-in discrepancies, or track resolution progress in real time."}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Badge variant='brand'>Academic Quality Cell</Badge>
        </div>
      </div>

      {/* Primary Tab Navigation */}
      <div className='erp-feedback-nav-tabs'>
        {isStaff ? (
          <>
            <button
              type='button'
              className={`erp-feedback-tab-btn ${activeTab === "console" ? "active" : ""}`}
              onClick={() => setActiveTab("console")}
            >
              <Icons.Shield size={16} />
              <span>Grievance Console ({allTickets.length})</span>
            </button>
            <button
              type='button'
              className={`erp-feedback-tab-btn ${activeTab === "submit" ? "active" : ""}`}
              onClick={() => setActiveTab("submit")}
            >
              <Icons.Plus size={16} />
              <span>Submit Operational Note</span>
            </button>
          </>
        ) : (
          <>
            <button
              type='button'
              className={`erp-feedback-tab-btn ${activeTab === "submit" ? "active" : ""}`}
              onClick={() => setActiveTab("submit")}
            >
              <Icons.Edit size={16} />
              <span>Submit Grievance / Discrepancy</span>
            </button>
            <button
              type='button'
              className={`erp-feedback-tab-btn ${activeTab === "my-tickets" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("my-tickets");
                fetchMyTickets();
              }}
            >
              <Icons.CheckSquare size={16} />
              <span>My Submitted Tickets ({myTickets.length})</span>
            </button>
          </>
        )}
      </div>

      {/* STAFF VIEW: Console Tab */}
      {isStaff && activeTab === "console" && (
        <div className='erp-staff-console-view'>
          {/* Executive Metrics Bar */}
          <div className='erp-feedback-metrics-grid'>
            <div className='erp-card erp-feedback-metric-card'>
              <span className='erp-feedback-metric-label'>Total Submissions</span>
              <strong className='erp-feedback-metric-val'>{metrics.total}</strong>
            </div>
            <div className='erp-card erp-feedback-metric-card'>
              <span className='erp-feedback-metric-label' style={{ color: "var(--status-late, #f59e0b)" }}>
                Pending Review
              </span>
              <strong className='erp-feedback-metric-val' style={{ color: "var(--status-late, #f59e0b)" }}>
                {metrics.pending}
              </strong>
            </div>
            <div className='erp-card erp-feedback-metric-card'>
              <span className='erp-feedback-metric-label' style={{ color: "var(--brand-primary, #3b82f6)" }}>
                Under Faculty Review
              </span>
              <strong className='erp-feedback-metric-val' style={{ color: "var(--brand-primary, #3b82f6)" }}>
                {metrics.reviewed}
              </strong>
            </div>
            <div className='erp-card erp-feedback-metric-card'>
              <span className='erp-feedback-metric-label' style={{ color: "var(--status-present, #10b981)" }}>
                Resolved Tickets
              </span>
              <strong className='erp-feedback-metric-val' style={{ color: "var(--status-present, #10b981)" }}>
                {metrics.resolved}
              </strong>
            </div>
          </div>

          {/* Filtering and Search Toolbar */}
          <div className='erp-card erp-feedback-toolbar'>
            <div className='erp-search-field-container' style={{ flex: 1, minWidth: "220px" }}>
              <Icons.Search size={16} className='erp-search-icon' />
              <input
                type='text'
                placeholder='Search student name, UID, or ticket text...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='erp-input'
                style={{ paddingLeft: "36px" }}
              />
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className='erp-select'
                style={{ width: "auto" }}
              >
                <option value='all'>All Categories</option>
                <option value='attendance-discrepancy'>Attendance Discrepancy</option>
                <option value='tokens'>Token Check-in & Speed</option>
                <option value='timetable'>Timetable & Course Schedule</option>
                <option value='general'>General Usability</option>
                <option value='bug'>Technical Bug</option>
                <option value='feature'>Feature Request</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='erp-select'
                style={{ width: "auto" }}
              >
                <option value='all'>All Statuses</option>
                <option value='pending'>Pending Review</option>
                <option value='reviewed'>In Review</option>
                <option value='resolved'>Resolved</option>
              </select>

              <button
                type='button'
                className='erp-btn erp-btn-ghost erp-btn-sm'
                onClick={fetchAllTickets}
                title='Refresh tickets'
                disabled={loadingAllTickets}
              >
                <Icons.Refresh size={14} />
              </button>
            </div>
          </div>

          {/* Tickets Stream */}
          <div className='erp-tickets-stream'>
            {loadingAllTickets ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Skeleton height={120} />
                <Skeleton height={120} />
                <Skeleton height={120} />
              </div>
            ) : allTickets.length === 0 ? (
              <EmptyState
                icon={Icons.MessageSquare}
                title='No feedback tickets found'
                description='No tickets match your active filter criteria. Check back when students submit feedback.'
              />
            ) : (
              allTickets.map((t) => (
                <div key={t._id} className='erp-card erp-ticket-card'>
                  <div className='erp-ticket-header'>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <div className='erp-student-mini-avatar'>
                        {(t.userName || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <strong style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
                            {t.userName || "Student User"}
                          </strong>
                          {t.userUid && (
                            <Badge variant='neutral' size='sm'>
                              {t.userUid}
                            </Badge>
                          )}
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            • {new Date(t.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                          <Badge variant='neutral' size='sm'>
                            {categoryLabels[t.category] || t.category}
                          </Badge>
                          <span style={{ color: "#f59e0b", fontSize: "0.82rem", fontWeight: 600 }}>
                            {"★".repeat(t.rating || 5)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {getStatusBadge(t.status)}
                      <button
                        type='button'
                        className='erp-btn erp-btn-secondary erp-btn-sm'
                        onClick={() => handleOpenResolutionModal(t)}
                        title='Review ticket & add official response'
                      >
                        <Icons.Edit size={13} />
                        <span>Action</span>
                      </button>
                      <button
                        type='button'
                        className='erp-btn erp-btn-ghost erp-btn-sm'
                        style={{ color: "var(--color-danger, #f43f5e)", padding: "6px" }}
                        onClick={() => handleDeleteTicket(t._id)}
                        title='Delete ticket record'
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div className='erp-ticket-body'>
                    <p style={{ margin: 0, color: "var(--text-primary)", lineHeight: 1.5 }}>
                      {t.comment}
                    </p>
                  </div>

                  {/* Official Resolution Remarks if available */}
                  {t.responseComment && (
                    <div className='erp-ticket-resolution-box'>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--brand-primary, #3b82f6)", textTransform: "uppercase" }}>
                          Official Faculty / Admin Remark
                        </span>
                        {t.resolvedAt && (
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            {new Date(t.resolvedAt).toLocaleDateString()} by {t.resolvedBy || "Faculty Cell"}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {t.responseComment}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* STUDENT VIEW: My Submitted Tickets Tab */}
      {!isStaff && activeTab === "my-tickets" && (
        <div className='erp-student-tickets-view'>
          <div className='erp-card erp-feedback-toolbar' style={{ marginBottom: "16px" }}>
            <div>
              <h2 className='erp-card-title'>My Attendance Discrepancy & Feedback Log</h2>
              <p className='erp-card-desc'>
                Track progress of your submitted queries, verify SLA timestamps, and view faculty responses.
              </p>
            </div>
            <button
              type='button'
              className='erp-btn erp-btn-secondary erp-btn-sm'
              onClick={fetchMyTickets}
              disabled={loadingMyTickets}
            >
              <Icons.Refresh size={14} />
              <span>Refresh</span>
            </button>
          </div>

          {loadingMyTickets ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <Skeleton height={110} />
              <Skeleton height={110} />
            </div>
          ) : myTickets.length === 0 ? (
            <EmptyState
              icon={Icons.CheckCircle}
              title='No submitted tickets yet'
              description='You have not registered any attendance discrepancy or feedback tickets. Click "Submit Grievance" to lodge a ticket.'
              action={
                <button
                  type='button'
                  className='erp-btn erp-btn-primary erp-btn-sm'
                  onClick={() => setActiveTab("submit")}
                >
                  <Icons.Plus size={14} />
                  <span>Submit New Ticket</span>
                </button>
              }
            />
          ) : (
            <div className='erp-tickets-stream'>
              {myTickets.map((t) => (
                <div key={t._id} className='erp-card erp-ticket-card'>
                  <div className='erp-ticket-header'>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Badge variant='neutral' size='sm'>
                          {categoryLabels[t.category] || t.category}
                        </Badge>
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Logged on {new Date(t.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ marginTop: "4px", color: "#f59e0b", fontSize: "0.82rem" }}>
                        {"★".repeat(t.rating || 5)}
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {getStatusBadge(t.status)}
                      {t.status === "pending" && (
                        <button
                          type='button'
                          className='erp-btn erp-btn-ghost erp-btn-xs'
                          style={{ color: "var(--color-danger, #f43f5e)" }}
                          onClick={() => handleWithdrawTicket(t._id)}
                          title='Withdraw pending ticket'
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>

                  <div className='erp-ticket-body'>
                    <p style={{ margin: 0, color: "var(--text-primary)", fontSize: "0.88rem", lineHeight: 1.5 }}>
                      {t.comment}
                    </p>
                  </div>

                  {t.responseComment ? (
                    <div className='erp-ticket-resolution-box'>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--status-present, #10b981)", textTransform: "uppercase" }}>
                          Official Faculty Resolution
                        </span>
                        {t.resolvedAt && (
                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                            Resolved on {new Date(t.resolvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {t.responseComment}
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "10px" }}>
                      ⏳ Status: Queued in Academic Operations. Faculty will review within standard 48h SLA.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBMISSION FORM VIEW (Available for both students and staff when tab is "submit") */}
      {activeTab === "submit" && (
        <div className='erp-feedback-layout-grid'>
          {/* Left: Feedback Form */}
          <div className='erp-feedback-card erp-card'>
            <h2 className='erp-card-title' style={{ marginBottom: "16px" }}>
              {isStaff ? "Submit Internal Operations / System Note" : "Submit Operational Review or Grievance"}
            </h2>
            <form onSubmit={handleSubmit} className='erp-feedback-form'>
              {/* Category */}
              <div className='erp-form-group'>
                <label className='erp-label'>Feedback / Grievance Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className='erp-select'
                >
                  <option value='general'>General Platform Usability</option>
                  <option value='tokens'>Token Check-in & Speed</option>
                  <option value='timetable'>Timetable & Course Schedule</option>
                  <option value='attendance-discrepancy'>Attendance Discrepancy / Missing Log</option>
                  <option value='feature'>New Feature Request</option>
                  <option value='bug'>Technical Bug or Display Issue</option>
                </select>
              </div>

              {/* Rating */}
              <div className='erp-form-group'>
                <label className='erp-label'>Overall System Satisfaction</label>
                <div className='erp-star-rating-row'>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type='button'
                      key={star}
                      className={`erp-star-btn ${star <= rating ? "active" : ""}`}
                      onClick={() => setRating(star)}
                      aria-label={`Rate ${star} of 5`}
                    >
                      ★
                    </button>
                  ))}
                  <span className='erp-rating-label'>
                    {rating === 5
                      ? "Excellent (5/5)"
                      : rating === 4
                      ? "Good (4/5)"
                      : rating === 3
                      ? "Average (3/5)"
                      : rating === 2
                      ? "Needs Improvement (2/5)"
                      : "Poor (1/5)"}
                  </span>
                </div>
              </div>

              {/* Comment */}
              <div className='erp-form-group'>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label htmlFor='comment' className='erp-label'>
                    Detailed Comments & Specifics
                  </label>
                  <span className='tabular-nums text-muted' style={{ fontSize: "0.75rem" }}>
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  id='comment'
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder='Provide details, session timestamps, or course code if reporting a check-in discrepancy...'
                  maxLength={500}
                  className='erp-textarea'
                  required
                />
              </div>

              <button
                type='submit'
                className='erp-btn erp-btn-primary'
                disabled={isSubmitting || !comment.trim()}
                style={{ width: "fit-content", padding: "9px 20px" }}
              >
                {isSubmitting ? (
                  <>
                    <span className='erp-spinner-sm' />
                    <span>Recording Feedback...</span>
                  </>
                ) : (
                  <>
                    <Icons.CheckCircle size={16} />
                    <span>Submit Ticket</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right: Grievance & SLA Support Panel */}
          <div className='erp-feedback-sidebar'>
            <div className='erp-card erp-support-info-card'>
              <div className='erp-card-heading-block'>
                <div className='erp-card-icon-pill'>
                  <Icons.Shield size={18} />
                </div>
                <div>
                  <h3 className='erp-card-title'>Resolution SLA & Policy</h3>
                  <p className='erp-card-desc'>Standard turnaround times for institutional submissions.</p>
                </div>
              </div>

              <div className='erp-support-steps'>
                {grievanceSteps.map((st, i) => (
                  <div key={i} className='erp-support-step-item'>
                    <strong>{st.step}</strong>
                    <p>{st.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className='erp-card erp-support-contacts-card'>
              <h3 className='erp-card-title' style={{ marginBottom: "10px" }}>Operational Support</h3>
              <div className='erp-contact-rows'>
                <div className='erp-contact-item'>
                  <span>Ticket Processing:</span>
                  <strong>Reviewed within 48 business hours</strong>
                </div>
                <div className='erp-contact-item'>
                  <span>Audit Trail:</span>
                  <strong>Timestamped and tied to your university UID</strong>
                </div>
                <div className='erp-contact-item'>
                  <span>Support Window:</span>
                  <span className='tabular-nums'>Monday–Friday during standard academic hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Staff Action & Resolution Modal */}
      {resolvingTicket && (
        <div
          role='dialog'
          aria-modal='true'
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(6, 8, 12, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setResolvingTicket(null);
          }}
        >
          <div
            className='erp-card'
            style={{
              width: "100%",
              maxWidth: "520px",
              background: "var(--bg-surface, #14171d)",
              border: "1px solid var(--border-color, #282d38)",
              borderRadius: "12px",
              padding: "24px",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div>
                <h3 className='erp-card-title' style={{ fontSize: "1.1rem" }}>
                  Review & Respond to Grievance
                </h3>
                <p className='erp-card-desc' style={{ fontSize: "0.8rem" }}>
                  From: {resolvingTicket.userName} ({resolvingTicket.userUid || "UID N/A"})
                </p>
              </div>
              <button
                type='button'
                className='erp-btn erp-btn-ghost erp-btn-xs'
                onClick={() => setResolvingTicket(null)}
              >
                <Icons.X size={16} />
              </button>
            </div>

            <div
              style={{
                padding: "12px",
                background: "var(--bg-surface-subtle, #1a1e27)",
                borderRadius: "8px",
                border: "1px solid var(--border-color, #282d38)",
                marginBottom: "16px",
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
              }}
            >
              <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "4px" }}>
                Student Observation:
              </strong>
              {resolvingTicket.comment}
            </div>

            <form onSubmit={handleSaveResolution} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                  Resolution Status *
                </label>
                <select
                  value={resolutionStatus}
                  onChange={(e) => setResolutionStatus(e.target.value)}
                  className='erp-select'
                  style={{ width: "100%" }}
                >
                  <option value='reviewed'>In Review (Under Faculty Inspection)</option>
                  <option value='resolved'>Resolved (Ledger Corrected / Answered)</option>
                  <option value='pending'>Pending (Awaiting Information)</option>
                </select>
              </div>

              <div>
                <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                  Official Faculty Remarks / Action Taken
                </label>
                <textarea
                  rows={4}
                  placeholder='e.g., Attendance ledger amended for Mobile App Dev on Nov 4. Verified with lecture logs.'
                  value={responseComment}
                  onChange={(e) => setResponseComment(e.target.value)}
                  className='erp-textarea'
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type='button'
                  className='erp-btn erp-btn-secondary'
                  onClick={() => setResolvingTicket(null)}
                  disabled={isSavingResolution}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='erp-btn erp-btn-primary'
                  disabled={isSavingResolution}
                >
                  {isSavingResolution ? "Saving..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Feedback;
