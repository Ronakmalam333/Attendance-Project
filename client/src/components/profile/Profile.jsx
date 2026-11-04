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
  }, []);

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

  const handleLogout = async () => {
    setLogoutModalOpen(false);
    try {
      await logout();
      toast.info("Signed out securely.");
      navigate("/");
    } catch (err) {
      toast.error("Logout encounter an error.");
    }
  };

  return (
    <div className='erp-profile-page'>
      {/* Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Account Profile & Settings</h1>
          <p className='erp-page-subtitle'>
            Manage institutional credentials, contact details, and account preferences.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
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

      <div className='erp-profile-layout-grid'>
        {/* User Card */}
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
            <h2 className='erp-profile-full-name'>
              {profileData.firstname || profileData.lastname
                ? `${profileData.firstname} ${profileData.lastname}`.trim()
                : profileData.name || "Academic User"}
            </h2>
            <span className='erp-profile-email-text'>{profileData.email}</span>
            <div style={{ marginTop: "6px" }}>
              <Badge variant={user?.role === "staff" ? "brand" : "neutral"} size='sm'>
                {user?.role === "staff" ? "Faculty Personnel" : "Enrolled Student"}
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
                <span className='erp-meta-label'>Course Program</span>
                <span className='erp-meta-value'>{profileData.course}</span>
              </div>
            )}
            {profileData.semester && (
              <div className='erp-meta-row'>
                <span className='erp-meta-label'>Current Term</span>
                <span className='erp-meta-value'>Semester {profileData.semester}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: "auto", paddingTop: "16px", borderTop: "1px solid var(--border-subtle)" }}>
            <button
              type='button'
              className='erp-btn erp-btn-secondary'
              style={{ width: "100%", justifyContent: "center", color: "var(--status-absent)" }}
              onClick={() => setLogoutModalOpen(true)}
            >
              <Icons.LogOut size={15} />
              <span>Sign Out of Account</span>
            </button>
          </div>
        </div>

        {/* Edit / Details Form */}
        <div className='erp-profile-details-card erp-card'>
          <h2 className='erp-card-title' style={{ marginBottom: "16px" }}>
            {isEditing ? "Edit Personal & Academic Records" : "Verified Academic Profile"}
          </h2>

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
              />
            </div>

            <div className='erp-form-group'>
              <label className='erp-label'>University Email (Read-Only)</label>
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
              />
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
