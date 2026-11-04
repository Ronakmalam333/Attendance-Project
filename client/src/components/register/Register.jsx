import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../tokenManager";
import { useToast } from "../../context/ToastContext";
import Icons from "../ui/Icons";
import "./register.css";

const coursesList = [
  "B.Tech Computer Science & Engineering",
  "B.Tech Information Technology",
  "B.Tech Electronics & Communication",
  "B.Tech Mechanical Engineering",
  "B.Tech Civil Engineering",
  "BCA (Computer Applications)",
  "MCA (Master of Computer Applications)",
];

const Register = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeRole, setActiveRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "student",
      course: coursesList[0],
      semester: "2",
    },
  });

  const password = watch("password");

  const handleRoleToggle = (role) => {
    setActiveRole(role);
    setValue("role", role);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const endpoint = activeRole === "student" ? "/student" : "/staff";

      const payload = {
        firstname: data.firstname.trim(),
        lastname: data.lastname.trim(),
        email: data.email.trim().toLowerCase(),
        uid: data.uid.trim().toUpperCase(),
        password: data.password,
        role: activeRole,
        ...(activeRole === "student" && {
          course: data.course,
          semester: data.semester,
        }),
      };

      await api.post(endpoint, payload);

      toast.success(
        `Account created successfully for ${activeRole === "student" ? "Student" : "Faculty"}! You can now sign in.`,
        "Registration Complete"
      );
      navigate("/signin");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Registration failed. Please check inputs.";
      toast.error(errorMsg, "Registration Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='erp-register-viewport'>
      <div className='erp-register-card erp-card'>
        {/* Header */}
        <div className='erp-auth-header'>
          <div className='erp-auth-logo-badge'>
            <Icons.GraduationCap size={22} />
          </div>
          <h1 className='erp-auth-title'>Academic Account Registration</h1>
          <p className='erp-auth-desc'>
            Enroll in the university attendance telemetry ecosystem
          </p>
        </div>

        {/* Role Selection */}
        <div className='erp-auth-role-tabs'>
          <button
            type='button'
            className={`erp-auth-tab ${activeRole === "student" ? "active" : ""}`}
            onClick={() => handleRoleToggle("student")}
          >
            <Icons.GraduationCap size={16} />
            <span>Student Account</span>
          </button>
          <button
            type='button'
            className={`erp-auth-tab ${activeRole === "staff" ? "active" : ""}`}
            onClick={() => handleRoleToggle("staff")}
          >
            <Icons.Shield size={16} />
            <span>Faculty / Staff</span>
          </button>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='erp-auth-form'>
          <input type='hidden' {...register("role")} value={activeRole} />

          {/* Name Row */}
          <div className='erp-form-row-2col'>
            <div className='erp-form-group'>
              <label htmlFor='firstname' className='erp-label'>First Name</label>
              <input
                id='firstname'
                type='text'
                placeholder='e.g., Alex'
                className={`erp-input ${errors.firstname ? "is-invalid" : ""}`}
                {...register("firstname", { required: "First name is required" })}
              />
              {errors.firstname && <span className='erp-field-error'>{errors.firstname.message}</span>}
            </div>

            <div className='erp-form-group'>
              <label htmlFor='lastname' className='erp-label'>Last Name</label>
              <input
                id='lastname'
                type='text'
                placeholder='e.g., Johnson'
                className={`erp-input ${errors.lastname ? "is-invalid" : ""}`}
                {...register("lastname", { required: "Last name is required" })}
              />
              {errors.lastname && <span className='erp-field-error'>{errors.lastname.message}</span>}
            </div>
          </div>

          {/* Email & UID Row */}
          <div className='erp-form-row-2col'>
            <div className='erp-form-group'>
              <label htmlFor='email' className='erp-label'>University Email</label>
              <input
                id='email'
                type='email'
                placeholder='student@rai.edu'
                className={`erp-input ${errors.email ? "is-invalid" : ""}`}
                {...register("email", {
                  required: "Email is required",
                  pattern: { value: /\S+@\S+\.\S+/, message: "Valid email required" },
                })}
              />
              {errors.email && <span className='erp-field-error'>{errors.email.message}</span>}
            </div>

            <div className='erp-form-group'>
              <label htmlFor='uid' className='erp-label'>
                {activeRole === "student" ? "Enrollment / UID" : "Faculty Employee ID"}
              </label>
              <input
                id='uid'
                type='text'
                placeholder='e.g., 230101'
                className={`erp-input ${errors.uid ? "is-invalid" : ""}`}
                {...register("uid", { required: "ID number is required" })}
              />
              {errors.uid && <span className='erp-field-error'>{errors.uid.message}</span>}
            </div>
          </div>

          {/* Student Specific: Course & Semester */}
          {activeRole === "student" && (
            <div className='erp-form-row-2col'>
              <div className='erp-form-group'>
                <label htmlFor='course' className='erp-label'>Degree Course</label>
                <select id='course' className='erp-select' {...register("course", { required: true })}>
                  {coursesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className='erp-form-group'>
                <label htmlFor='semester' className='erp-label'>Current Semester</label>
                <select id='semester' className='erp-select' {...register("semester", { required: true })}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s.toString()}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Password Row */}
          <div className='erp-form-row-2col'>
            <div className='erp-form-group'>
              <label htmlFor='password' className='erp-label'>Password</label>
              <input
                id='password'
                type='password'
                placeholder='Min 4 characters'
                className={`erp-input ${errors.password ? "is-invalid" : ""}`}
                {...register("password", {
                  required: "Password required",
                  minLength: { value: 4, message: "Min 4 characters" },
                })}
              />
              {errors.password && <span className='erp-field-error'>{errors.password.message}</span>}
            </div>

            <div className='erp-form-group'>
              <label htmlFor='confirmPassword' className='erp-label'>Confirm Password</label>
              <input
                id='confirmPassword'
                type='password'
                placeholder='Re-enter password'
                className={`erp-input ${errors.confirmPassword ? "is-invalid" : ""}`}
                {...register("confirmPassword", {
                  validate: (value) => value === password || "Passwords do not match",
                })}
              />
              {errors.confirmPassword && (
                <span className='erp-field-error'>{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          <button
            type='submit'
            className='erp-btn erp-btn-primary erp-auth-submit-btn'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className='erp-spinner-sm' />
                <span>Registering Account...</span>
              </>
            ) : (
              <span>Complete {activeRole === "student" ? "Student" : "Staff"} Registration</span>
            )}
          </button>
        </form>

        <div className='erp-auth-footer'>
          <span>Already enrolled in the system? </span>
          <Link to='/signin' className='erp-auth-link'>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
