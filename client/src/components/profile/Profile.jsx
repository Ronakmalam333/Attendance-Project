import React, { useContext, useState, useEffect } from "react";
import "./Profile.css";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import axios from "../../tokenManager";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import Skeleton from "../ui/Skeleton";
import ConfirmModal from "../ui/ConfirmModal";

const normalizeProfile = (data = {}) => {
  const fullName = (data.name || "").trim();
  const parts = fullName.split(/\s+/).filter(Boolean);
  const firstname = data.firstname || parts[0] || "";
  const lastname = data.lastname || (parts.length > 1 ? parts.slice(1).join(" ") : "");

  return {
    ...data,
    firstname,
    lastname,
  };
};

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Notification Preferences State (interactive)
  const [notifications, setNotifications] = useState({
    attendanceAlerts: true,
    shortageWarning: true,
    discrepancyUpdates: true,
    weeklyDigest: false,
  });

  const [profileData, setProfileData] = useState({
    firstname: "",
    lastname: "",
    name: "",
    email: "",
    uid: "",
    course: "",
    semester: "",
  });

  const { user, logout } = useContext(AuthContext);
  const toast = useToast();
  const navigate = useNavigate();

  const isStaff = user?.role === "staff" || localStorage.getItem("role") === "staff";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await axios.get("/profile");
        const normalized = normalizeProfile(response.data);
        setProfileData({
          firstname: normalized.firstname || "",
          lastname: normalized.lastname || "",
          name: normalized.name || "",
          email: normalized.email || "",
          uid: normalized.uid || "",
          course: normalized.course || "",
          semester: normalized.semester || "",
        });

        if (response.data.profilePicture) {
          setProfilePic(response.data.profilePicture);
        }
      } catch (error) {
        toast.error("Failed to load user profile information.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [toast]);

  const handleProfilePicChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please select a valid image file (PNG, JPG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File size exceeds 5MB limit. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const maxWidth = 400;
        const maxHeight = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
        setProfilePic(compressedBase64);

        try {
          await axios.put("/profile", { profilePicture: compressedBase64 });
          toast.success("Profile avatar updated successfully!");
        } catch (error) {
          toast.error("Failed to save profile picture on server.");
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = {
        ...profileData,
        name: `${profileData.firstname} ${profileData.lastname}`.trim(),
      };
      delete dataToSend.firstname;
      delete dataToSend.lastname;

      const response = await axios.put("/profile", dataToSend);
      const result = response.data;

      setIsEditing(false);
      toast.success("Profile details saved successfully.");

      if (result.user) {
        const normalized = normalizeProfile(result.user);
        setProfileData({
          firstname: normalized.firstname || "",
          lastname: normalized.lastname || "",
          name: normalized.name || "",
          email: normalized.email || "",
          uid: normalized.uid || "",
          course: normalized.course || "",
          semester: normalized.semester || "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile details.");
    } finally {
      setSaving(false);
    }
  };

  const toggleNotification = (key) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast.info(`Preference updated: ${key} is now ${updated[key] ? "Enabled" : "Disabled"}.`);
      return updated;
    });
  };

  const handleLogout = async () => {
    setLogoutModalOpen(false);
    try {
      await logout();
      toast.info("Signed out securely.");
      navigate("/");
    } catch (err) {
      toast.error("Logout encountered an error.");
    }
  };

  const displayName = profileData.firstname || profileData.lastname
    ? `${profileData.firstname} ${profileData.lastname}`.trim()
    : profileData.name || "Academic User";

  return (
    <div className='erp-profile-page'>
      {/* Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Account Profile & Institutional Settings</h1>
          <p className='erp-page-subtitle'>
            Manage university identity, academic credentials, security parameters, and notification channels.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {!isEditing ? (
            <button
              type='button'
              className='erp-btn erp-btn-secondary'
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              <Icons.Edit size={15} />
              <span>Edit Details</span>
            </button>
          ) : (
            <>
              <button
                type='button'
                className='erp-btn erp-btn-ghost'
                onClick={() => setIsEditing(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type='button'
                className='erp-btn erp-btn-primary'
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column (Identity & Security) + Right Column (Academic Form & Telemetry) */}
      <div className='erp-profile-layout-grid'>
        {/* LEFT COLUMN */}
        <div className='erp-profile-left-col'>
          {/* Identity Card */}
          <div className='erp-profile-summary-card erp-card'>
            <div className='erp-profile-avatar-wrapper'>
              <label htmlFor='profile-upload' className='erp-avatar-upload-label' title='Change photo'>
                <input
                  type='file'
                  id='profile-upload'
                  accept='image/*'
                  onChange={handleProfilePicChange}
                  hidden
                />
                {profilePic ? (
                  <img src={profilePic} alt='Profile' className='erp-profile-full-avatar' />
                ) : (
                  <div className='erp-profile-avatar-fallback'>
                    <Icons.User size={48} />
                  </div>
                )}
                <div className='erp-avatar-hover-overlay'>
                  <Icons.Edit size={16} />
                </div>
              </label>
            </div>

            <div className='erp-profile-info-block'>
              <h2 className='erp-profile-full-name'>{displayName}</h2>
              <span className='erp-profile-email-text'>{profileData.email}</span>
              <div style={{ marginTop: "6px" }}>
                <Badge variant={isStaff ? "brand" : "neutral"} size='sm'>
                  {isStaff ? "Faculty Personnel" : "Enrolled Student"}
                </Badge>
              </div>
            </div>

            <div className='erp-profile-meta-list'>
              <div className='erp-meta-row'>
                <span className='erp-meta-label'>Institutional UID</span>
                <span className='erp-meta-value tabular-nums'>{profileData.uid || "N/A"}</span>
              </div>
              {profileData.course && (
                <div className='erp-meta-row'>
                  <span className='erp-meta-label'>Degree / Program</span>
                  <span className='erp-meta-value'>{profileData.course}</span>
                </div>
              )}
              {profileData.semester && (
                <div className='erp-meta-row'>
                  <span className='erp-meta-label'>Academic Term</span>
                  <span className='erp-meta-value'>Semester {profileData.semester}</span>
                </div>
              )}
              <div className='erp-meta-row'>
                <span className='erp-meta-label'>Affiliation Status</span>
                <span className='erp-meta-value' style={{ color: "var(--status-present, #10b981)", fontWeight: 600 }}>
                  Active & Verified
                </span>
              </div>
            </div>

            <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-subtle, #282d38)", width: "100%" }}>
              <button
                type='button'
                className='erp-btn erp-btn-secondary'
                style={{ width: "100%", justifyContent: "center", color: "var(--status-absent, #ef4444)" }}
                onClick={() => setLogoutModalOpen(true)}
              >
                <Icons.LogOut size={15} />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>

          {/* Security & Access Telemetry Card */}
          <div className='erp-card erp-profile-security-card'>
            <div className='erp-card-heading-block'>
              <div className='erp-card-icon-pill'>
                <Icons.Shield size={16} />
              </div>
              <div>
                <h3 className='erp-card-title' style={{ fontSize: "0.95rem" }}>Security & Credentials</h3>
                <p className='erp-card-desc' style={{ fontSize: "0.75rem" }}>Authentication parameters and session integrity.</p>
              </div>
            </div>

            <div className='erp-security-specs-list'>
              <div className='erp-spec-item'>
                <span>Authentication Method:</span>
                <strong>Institutional SSO / AMS Vault</strong>
              </div>
              <div className='erp-spec-item'>
                <span>Transport Security:</span>
                <span className='tabular-nums'>TLS 1.3 • AES-256 GCM</span>
              </div>
              <div className='erp-spec-item'>
                <span>Token Refresh Window:</span>
                <span className='tabular-nums'>7-Day Rotating JWT</span>
              </div>
              <div className='erp-spec-item'>
                <span>Account Standing:</span>
                <Badge variant='present' size='sm'>Good Standing</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className='erp-profile-right-col'>
          {/* Edit / Details Form */}
          <div className='erp-profile-details-card erp-card'>
            <div className='erp-card-heading-block' style={{ marginBottom: "16px" }}>
              <div className='erp-card-icon-pill'>
                <Icons.User size={16} />
              </div>
              <div>
                <h2 className='erp-card-title'>
                  {isEditing ? "Edit Personal & Academic Records" : "Verified Academic Profile"}
                </h2>
                <p className='erp-card-desc'>
                  Official records synchronized with the university registrar database.
                </p>
              </div>
            </div>

            <div className='erp-profile-form-grid'>
              <div className='erp-form-group'>
                <label className='erp-label'>First Name</label>
                <input
                  type='text'
                  name='firstname'
                  value={profileData.firstname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className='erp-input'
                  placeholder='First Name'
                />
              </div>

              <div className='erp-form-group'>
                <label className='erp-label'>Last Name</label>
                <input
                  type='text'
                  name='lastname'
                  value={profileData.lastname}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className='erp-input'
                  placeholder='Last Name'
                />
              </div>

              <div className='erp-form-group'>
                <label className='erp-label'>University Email (Immutable)</label>
                <input
                  type='email'
                  value={profileData.email}
                  disabled
                  className='erp-input'
                  style={{ opacity: 0.7 }}
                />
              </div>

              <div className='erp-form-group'>
                <label className='erp-label'>Institutional UID / Staff Code</label>
                <input
                  type='text'
                  name='uid'
                  value={profileData.uid}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className='erp-input tabular-nums'
                  placeholder='Institutional UID'
                />
              </div>

              <div className='erp-form-group'>
                <label className='erp-label'>Academic Degree / Course</label>
                <input
                  type='text'
                  name='course'
                  value={profileData.course}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className='erp-input'
                  placeholder='e.g., B.Tech Computer Science'
                />
              </div>

              <div className='erp-form-group'>
                <label className='erp-label'>Academic Semester</label>
                <input
                  type='text'
                  name='semester'
                  value={profileData.semester}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className='erp-input tabular-nums'
                  placeholder='e.g., 4'
                />
              </div>
            </div>
          </div>

          {/* Academic Governance & Regulations Card */}
          <div className='erp-card erp-profile-governance-card'>
            <div className='erp-card-heading-block'>
              <div className='erp-card-icon-pill'>
                <Icons.BookOpen size={16} />
              </div>
              <div>
                <h3 className='erp-card-title' style={{ fontSize: "1rem" }}>
                  Institutional Policies & Attendance Compliance
                </h3>
                <p className='erp-card-desc'>Rules governing classroom attendance and examination eligibility.</p>
              </div>
            </div>

            <div className='erp-governance-rules-grid'>
              <div className='erp-gov-rule-box'>
                <span className='erp-gov-badge'>Statutory Mandate</span>
                <strong>75% Minimum Attendance</strong>
                <p>Students must maintain at least 75% physical attendance in each registered subject to sit for end-semester exams.</p>
              </div>
              <div className='erp-gov-rule-box'>
                <span className='erp-gov-badge'>Discrepancy Window</span>
                <strong>48-Hour Resolution SLA</strong>
                <p>Check-in discrepancies must be lodged via the Campus Feedback Desk within 48h of lecture conclusion.</p>
              </div>
              <div className='erp-gov-rule-box'>
                <span className='erp-gov-badge'>Proxy Prevention</span>
                <strong>Dynamic Token Verification</strong>
                <p>Broadcast tokens expire automatically. Cryptographic verification prevents unauthorized attendance claims.</p>
              </div>
            </div>
          </div>

          {/* Notification & Communication Preferences */}
          <div className='erp-card erp-profile-notifications-card'>
            <div className='erp-card-heading-block' style={{ marginBottom: "12px" }}>
              <div className='erp-card-icon-pill'>
                <Icons.CheckSquare size={16} />
              </div>
              <div>
                <h3 className='erp-card-title' style={{ fontSize: "1rem" }}>
                  Communication & Notification Channels
                </h3>
                <p className='erp-card-desc'>Configure automated email and campus dispatch alerts.</p>
              </div>
            </div>

            <div className='erp-prefs-toggle-list'>
              <div className='erp-pref-toggle-row'>
                <div>
                  <strong>Lecture Check-In Confirmations</strong>
                  <p>Receive immediate dispatch receipt upon successful attendance token submission.</p>
                </div>
                <button
                  type='button'
                  className={`erp-toggle-pill ${notifications.attendanceAlerts ? "active" : ""}`}
                  onClick={() => toggleNotification("attendanceAlerts")}
                >
                  {notifications.attendanceAlerts ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className='erp-pref-toggle-row'>
                <div>
                  <strong>75% Threshold Shortage Warnings</strong>
                  <p>Automated alerts when your cumulative course attendance approaches margin risk.</p>
                </div>
                <button
                  type='button'
                  className={`erp-toggle-pill ${notifications.shortageWarning ? "active" : ""}`}
                  onClick={() => toggleNotification("shortageWarning")}
                >
                  {notifications.shortageWarning ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className='erp-pref-toggle-row'>
                <div>
                  <strong>Grievance Ticket Resolution Alerts</strong>
                  <p>Notifies you when faculty responds to your attendance observation or issue.</p>
                </div>
                <button
                  type='button'
                  className={`erp-toggle-pill ${notifications.discrepancyUpdates ? "active" : ""}`}
                  onClick={() => toggleNotification("discrepancyUpdates")}
                >
                  {notifications.discrepancyUpdates ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className='erp-pref-toggle-row'>
                <div>
                  <strong>Weekly Academic Performance Digest</strong>
                  <p>Comprehensive weekly PDF summary of attended sessions delivered every Monday.</p>
                </div>
                <button
                  type='button'
                  className={`erp-toggle-pill ${notifications.weeklyDigest ? "active" : ""}`}
                  onClick={() => toggleNotification("weeklyDigest")}
                >
                  {notifications.weeklyDigest ? "Enabled" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={logoutModalOpen}
        title='Confirm Sign Out'
        message='Are you sure you want to end your current session?'
        confirmLabel='Sign Out'
        cancelLabel='Stay Signed In'
        variant='danger'
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
