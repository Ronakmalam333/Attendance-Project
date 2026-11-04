import React, { useState } from "react";
import axios from "../../tokenManager";
import { useToast } from "../../context/ToastContext";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import "./feedback.css";

const grievanceSteps = [
  {
    step: "1. Ticket Ingestion",
    desc: "Your observation is categorized and submitted to the Academic Operations & Quality Assurance cell.",
  },
  {
    step: "2. Faculty Review",
    desc: "For lecture or token discrepancies, the concerned faculty member is notified to inspect session timestamps.",
  },
  {
    step: "3. Resolution SLA (48h)",
    desc: "Attendance rectifications or platform bug fixes are processed and recorded within two university working days.",
  },
];

function Feedback() {
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState("general");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.warning("Please enter your comments or suggestions.", "Feedback Required");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post("/feedback", {
        category,
        rating: Number(rating),
        comment: comment.trim(),
      });

      toast.success(
        response.data?.message || "Thank you! Your feedback has been logged into the quality review system.",
        "Feedback Received"
      );
      setRating(5);
      setComment("");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to submit feedback. Please check connection and try again.",
        "Submission Failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='erp-feedback-page'>
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>System & Campus Feedback Desk</h1>
          <p className='erp-page-subtitle'>
            Submit feedback, report classroom check-in issues, or propose platform enhancements.
          </p>
        </div>
        <Badge variant='brand'>Academic Quality Cell</Badge>
      </div>

      <div className='erp-feedback-layout-grid'>
        {/* Left: Feedback Form */}
        <div className='erp-feedback-card erp-card'>
          <h2 className='erp-card-title' style={{ marginBottom: "16px" }}>
            Submit Operational Review or Grievance
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
                <p className='erp-card-desc'>Standard turnaround times for student submissions.</p>
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
    </div>
  );
}

export default Feedback;
