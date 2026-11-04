import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import axios from "../../tokenManager";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import "./CompleteProfile.css";

function CompleteProfile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const toast = useToast();
  const { user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const isStudent = user?.role === "student";

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const profileData = isStudent
        ? {
            name: data.name.trim(),
            uid: data.uid.trim().toUpperCase(),
            course: data.course,
            semester: data.semester,
          }
        : {
            name: data.name.trim(),
            uid: data.uid.trim().toUpperCase(),
          };

      await axios.put("/profile", profileData);

      // Update user context
      login({
        ...user,
        name: data.name.trim(),
        uid: data.uid.trim().toUpperCase(),
        ...(isStudent && {
          course: data.course,
          semester: data.semester,
        }),
        profileCompleted: true,
      });

      toast.success("Profile setup finalized successfully!", "Profile Completed");
      navigate(isStudent ? "/student" : "/staff");
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update profile. Please try again.";
      toast.error(errorMessage, "Profile Setup Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='erp-complete-profile-viewport'>
      <div className='erp-complete-profile-card erp-card'>
        <div className='erp-auth-header'>
          <div className='erp-auth-logo-badge'>
            <Icons.User size={22} />
          </div>
          <h1 className='erp-auth-title'>Complete Your Academic Profile</h1>
          <p className='erp-auth-desc'>
            {isStudent
              ? "Link your university UID, degree course, and semester to finalize registration"
              : "Verify your staff employee ID and departmental credentials"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className='erp-auth-form'>
          <div className='erp-form-group'>
            <label htmlFor='name' className='erp-label'>Full Legal Name</label>
            <input
              type='text'
              id='name'
              placeholder={isStudent ? "e.g., Alex Johnson" : "e.g., Prof. Sarah Mitchell"}
              defaultValue={user?.name !== "Pending" ? user?.name : ""}
              className={`erp-input ${errors.name ? "is-invalid" : ""}`}
              {...register("name", {
                required: "Full name is required",
                minLength: { value: 3, message: "Min 3 characters" },
              })}
            />
            {errors.name && <span className='erp-field-error'>{errors.name.message}</span>}
          </div>

          <div className='erp-form-group'>
            <label htmlFor='uid' className='erp-label'>
              {isStudent ? "University Enrollment Number (UID)" : "Staff Identification Code"}
            </label>
            <input
              type='text'
              id='uid'
              placeholder={isStudent ? "e.g., 24BTCSE001" : "e.g., STAFF042"}
              className={`erp-input ${errors.uid ? "is-invalid" : ""}`}
              {...register("uid", {
                required: "Identification ID is required",
                minLength: { value: 3, message: "Min 3 characters" },
              })}
            />
            {errors.uid && <span className='erp-field-error'>{errors.uid.message}</span>}
          </div>

          {isStudent && (
            <div className='erp-form-row-2col'>
              <div className='erp-form-group'>
                <label htmlFor='course' className='erp-label'>Course / Degree</label>
                <select
                  id='course'
                  className={`erp-select ${errors.course ? "is-invalid" : ""}`}
                  {...register("course", { required: "Please select course" })}
                >
                  <option value=''>Select Course</option>
                  <option value='BTech'>BTech - Bachelor of Technology</option>
                  <option value='BCA'>BCA - Computer Applications</option>
                  <option value='MCA'>MCA - Master of Computer Applications</option>
                  <option value='MTech'>MTech - Master of Technology</option>
                  <option value='BSc'>BSc - Bachelor of Science</option>
                </select>
                {errors.course && <span className='erp-field-error'>{errors.course.message}</span>}
              </div>

              <div className='erp-form-group'>
                <label htmlFor='semester' className='erp-label'>Current Semester</label>
                <select
                  id='semester'
                  className={`erp-select ${errors.semester ? "is-invalid" : ""}`}
                  {...register("semester", { required: "Select semester" })}
                >
                  <option value=''>Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s.toString()}>
                      Semester {s}
                    </option>
                  ))}
                </select>
                {errors.semester && <span className='erp-field-error'>{errors.semester.message}</span>}
              </div>
            </div>
          )}

          <button
            type='submit'
            className='erp-btn erp-btn-primary erp-auth-submit-btn'
            disabled={loading}
          >
            {loading ? (
              <>
                <span className='erp-spinner-sm' />
                <span>Saving Profile...</span>
              </>
            ) : (
              <span>Finalize & Enter Portal</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
