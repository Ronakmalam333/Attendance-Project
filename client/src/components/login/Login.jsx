import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { tokenManager } from "../../tokenManager";
import { useToast } from "../../context/ToastContext";
import { useGoogleLogin } from "@react-oauth/google";
import Icons from "../ui/Icons";
import ThemeToggle from "../ThemeToggle";
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

        toast.success(`Welcome, ${result.user?.name || "User"}!`, "Authentication Succeeded");

        if (result.user?.profileCompleted === false) {
          navigate("/complete-profile");
        } else {
          navigate(result.role === "student" ? "/student" : "/staff");
        }
      } catch (error) {
        const msg = error.response?.data?.message || "Google sign-in failed. Please try again.";
        toast.error(msg, "Sign-In Error");
      }
    },
    onError: () => {
      toast.error("Google authentication dialog was closed or cancelled.", "Cancelled");
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
      toast.success(`Signed in as ${result.role === "staff" ? "Faculty" : "Student"}.`, "Welcome");
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
      {/* Top Utility Bar */}
      <div className='erp-auth-topbar'>
        <div className='erp-auth-top-brand'>
          <div className='erp-top-brand-icon'>
            <Icons.Shield size={16} />
          </div>
          <span className='erp-top-brand-title'>AMS Attendance</span>
        </div>
        <div className='erp-auth-top-actions'>
          <ThemeToggle />
        </div>
      </div>

      <div className='erp-auth-split-wrapper'>
        {/* Left Side: Brand Showcase & Institutional Capabilities */}
        <div className='erp-auth-showcase-panel'>
          <div className='erp-showcase-content'>
            <div className='erp-showcase-badge'>
              <span className='erp-status-dot' />
              <span>University Ready • Big Data Ingestion Supported</span>
            </div>

            <h1 className='erp-showcase-headline'>
              Attendance Management & Academic Records
            </h1>

            <p className='erp-showcase-description'>
              A fast, reliable attendance tracking platform built for universities. Manage student rosters, streamline lecture verification, and monitor compliance in real time.
            </p>

            <div className='erp-showcase-features'>
              <div className='erp-feature-item'>
                <div className='erp-feature-icon-box'>
                  <Icons.CheckSquare size={16} />
                </div>
                <div className='erp-feature-text'>
                  <strong>Smart Classroom Check-in</strong>
                  <span>Dynamic 4-character tokens eliminate proxy attendance and auto-expire in minutes.</span>
                </div>
              </div>

              <div className='erp-feature-item'>
                <div className='erp-feature-icon-box'>
                  <Icons.Database size={16} />
                </div>
                <div className='erp-feature-text'>
                  <strong>Big Data Excel (.xlsx) & CSV Ingestion</strong>
                  <span>Instantly import complete student cohorts, faculty rosters, and semester schedules.</span>
                </div>
              </div>

              <div className='erp-feature-item'>
                <div className='erp-feature-icon-box'>
                  <Icons.FileText size={16} />
                </div>
                <div className='erp-feature-text'>
                  <strong>Statutory 75% Rule Compliance</strong>
                  <span>Continuous attendance monitoring, margin calculation, and exportable PDF transcripts.</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className='erp-showcase-stats-card'>
              <div className='erp-showcase-stat-col'>
                <span className='erp-showcase-stat-num tabular-nums'>Bulk Ready</span>
                <span className='erp-showcase-stat-label'>Excel / CSV Import</span>
              </div>
              <div className='erp-showcase-stat-sep' />
              <div className='erp-showcase-stat-col'>
                <span className='erp-showcase-stat-num tabular-nums'>Real-time</span>
                <span className='erp-showcase-stat-label'>Token Verification</span>
              </div>
              <div className='erp-showcase-stat-sep' />
              <div className='erp-showcase-stat-col'>
                <span className='erp-showcase-stat-num tabular-nums'>Audit Safe</span>
                <span className='erp-showcase-stat-label'>PDF Transcripts</span>
              </div>
            </div>
          </div>

          <div className='erp-showcase-footer'>
            <span>Project Originator & Lead Developer: <strong>Ronak Malam</strong></span>
            <span>v2.4</span>
          </div>
        </div>

        {/* Right Side: Clean Authentication Card */}
        <div className='erp-auth-card-panel'>
          <div className='erp-auth-card erp-card'>
            <div className='erp-auth-header'>
              <h2 className='erp-auth-title'>Sign In</h2>
              <p className='erp-auth-desc'>
                Select your account role to continue
              </p>
            </div>

            {/* Role Selection Tabs */}
            <div className='erp-auth-role-tabs'>
              <button
                type='button'
                className={`erp-auth-tab ${activeRole === "student" ? "active" : ""}`}
                onClick={() => handleRoleChange("student")}
              >
                <Icons.GraduationCap size={15} />
                <span>Student</span>
              </button>
              <button
                type='button'
                className={`erp-auth-tab ${activeRole === "staff" ? "active" : ""}`}
                onClick={() => handleRoleChange("staff")}
              >
                <Icons.Shield size={15} />
                <span>Faculty</span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className='erp-auth-form'>
              <input type='hidden' {...register("role")} value={activeRole} />

              <div className='erp-form-group'>
                <label htmlFor='username' className='erp-label'>
                  {activeRole === "student" ? "Email or Student ID" : "Email or Faculty ID"}
                </label>
                <div className='erp-input-with-icon'>
                  <Icons.User size={15} className='erp-input-icon' />
                  <input
                    id='username'
                    type='text'
                    placeholder={activeRole === "student" ? "e.g., 24BTCSE003 or student@email.com" : "e.g., faculty@email.com"}
                    className={`erp-input ${errors.username ? "is-invalid" : ""}`}
                    autoComplete='username'
                    {...register("username", { required: "Please enter your ID or email" })}
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
                  <Icons.Lock size={15} className='erp-input-icon' />
                  <input
                    id='password'
                    type={showPassword ? "text" : "password"}
                    placeholder='Enter your password'
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
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In as {activeRole === "student" ? "Student" : "Faculty"}</span>
                )}
              </button>
            </form>

            <div className='erp-auth-divider'>
              <span>or continue with Google</span>
            </div>

            {/* Google Account */}
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
              <span>Google Account</span>
            </button>

            <div className='erp-auth-footer'>
              <span>Don't have an account? </span>
              <Link to='/signup' className='erp-auth-link'>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Grounded Institutional Telemetry Footer */}
      <footer className='erp-auth-bottom-footer'>
        <div className='erp-auth-bottom-inner'>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className='erp-footer-pulse-dot' />
            <span>AMS Institutional Platform • High-Assurance Telemetry • TLS 1.3</span>
          </div>
          <div>
            <span>Project Originator & Lead Developer: <strong style={{ color: "var(--text-primary)" }}>Ronak Malam</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Login;
