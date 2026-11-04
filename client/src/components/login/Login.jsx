import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { tokenManager } from "../../tokenManager";
import { useToast } from "../../context/ToastContext";
import { useGoogleLogin } from "@react-oauth/google";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const { login } = useContext(AuthContext);

  const [activeRole, setActiveRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "student",
      username: "",
      password: "",
    },
  });

  const handleRoleChange = (role) => {
    setActiveRole(role);
    setValue("role", role);
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await tokenManager.googleLogin({
          accessToken: tokenResponse.access_token,
          role: activeRole,
        });

        login({
          ...result.user,
          role: result.role,
        });

        toast.success(`Welcome back, ${result.user?.name || "User"}!`, "Authentication Successful");

        if (result.user?.profileCompleted === false) {
          navigate("/complete-profile");
        } else {
          navigate(result.role === "student" ? "/student" : "/staff");
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Google Single Sign-On failed. Please try again.";
        toast.error(msg, "Google Sign-In Error");
      }
    },
    onError: () => {
      toast.error("Google authentication dialog was closed or rejected.", "Sign-In Aborted");
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await tokenManager.login({
        username: data.username.trim(),
        password: data.password,
        role: activeRole,
      });

      login({ ...result.user, role: result.role });
      toast.success(`Authenticated as ${result.role === "staff" ? "Faculty/Admin" : "Student"}.`, "Welcome");
      navigate(result.role === "student" ? "/student" : "/staff");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Invalid credentials or unauthorized role access.";
      toast.error(errorMessage, "Login Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='erp-auth-viewport'>
      <div className='erp-auth-card erp-card'>
        {/* Brand Banner */}
        <div className='erp-auth-header'>
          <div className='erp-auth-logo-badge'>
            <Icons.Shield size={22} />
          </div>
          <h1 className='erp-auth-title'>AMS Institutional Portal</h1>
          <p className='erp-auth-desc'>
            Attendance Management & Classroom Telemetry System
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className='erp-auth-role-tabs'>
          <button
            type='button'
            className={`erp-auth-tab ${activeRole === "student" ? "active" : ""}`}
            onClick={() => handleRoleChange("student")}
          >
            <Icons.GraduationCap size={16} />
            <span>Student Login</span>
          </button>
          <button
            type='button'
            className={`erp-auth-tab ${activeRole === "staff" ? "active" : ""}`}
            onClick={() => handleRoleChange("staff")}
          >
            <Icons.Shield size={16} />
            <span>Faculty / Staff</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className='erp-auth-form'>
          <input type='hidden' {...register("role")} value={activeRole} />

          <div className='erp-form-group'>
            <label htmlFor='username' className='erp-label'>
              {activeRole === "student" ? "Student Email or UID" : "Faculty Email or Staff ID"}
            </label>
            <div className='erp-input-with-icon'>
              <Icons.User size={16} className='erp-input-icon' />
              <input
                id='username'
                type='text'
                placeholder={activeRole === "student" ? "e.g., student@rai.edu or 230101" : "e.g., faculty@rai.edu"}
                className={`erp-input ${errors.username ? "is-invalid" : ""}`}
                autoComplete='username'
                {...register("username", { required: "Please enter your university ID or email" })}
              />
            </div>
            {errors.username && <span className='erp-field-error'>{errors.username.message}</span>}
          </div>

          <div className='erp-form-group'>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor='password' className='erp-label'>
                Password
              </label>
            </div>
            <div className='erp-input-with-icon'>
              <Icons.Lock size={16} className='erp-input-icon' />
              <input
                id='password'
                type={showPassword ? "text" : "password"}
                placeholder='Enter password'
                className={`erp-input ${errors.password ? "is-invalid" : ""}`}
                autoComplete='current-password'
                {...register("password", {
                  required: "Password is required",
                  minLength: { value: 4, message: "Password must be at least 4 characters" },
                })}
              />
              <button
                type='button'
                className='erp-toggle-password-btn'
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <span className='erp-field-error'>{errors.password.message}</span>}
          </div>

          <button
            type='submit'
            className='erp-btn erp-btn-primary erp-auth-submit-btn'
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className='erp-spinner-sm' />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to {activeRole === "student" ? "Student Portal" : "Faculty Console"}</span>
            )}
          </button>
        </form>

        <div className='erp-auth-divider'>
          <span>or continue with Google SSO</span>
        </div>

        {/* Google Workspace SSO */}
        <button
          type='button'
          className='erp-btn erp-btn-secondary erp-google-sso-btn'
          onClick={() => googleLogin()}
          disabled={isSubmitting}
        >
          <svg width='18' height='18' viewBox='0 0 24 24'>
            <path
              d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
              fill='#4285F4'
            />
            <path
              d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
              fill='#34A853'
            />
            <path
              d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z'
              fill='#FBBC05'
            />
            <path
              d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z'
              fill='#EA4335'
            />
          </svg>
          <span>University Google Account</span>
        </button>

        <div className='erp-auth-footer'>
          <span>New student or academic personnel? </span>
          <Link to='/signup' className='erp-auth-link'>
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
