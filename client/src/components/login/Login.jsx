import React, { useState, useContext, useEffect, useRef } from "react";
import "./login.css";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import { tokenManager } from "../../tokenManager";

function Login() {
  const navigate = useNavigate();
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [eye, setEye] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const { login } = useContext(AuthContext);

  const handleEmailFocus = () => setEmailFocused(true);
  const handleEmailBlur = () => setEmailFocused(false);
  const handlePasswordFocus = () => setPasswordFocused(true);
  const handlePasswordBlur = () => setPasswordFocused(false);
  const handleEye = () => setEye(!eye);

  // Check for autofilled values
  useEffect(() => {
    const checkAutofill = () => {
      if (emailRef.current) {
        const isAutofilled =
          emailRef.current.matches(":-webkit-autofill") ||
          emailRef.current.value !== "";
        if (isAutofilled) {
          setEmailValue(emailRef.current.value || "autofilled");
        }
      }
      if (passwordRef.current) {
        const isAutofilled =
          passwordRef.current.matches(":-webkit-autofill") ||
          passwordRef.current.value !== "";
        if (isAutofilled) {
          setPasswordValue(passwordRef.current.value || "autofilled");
        }
      }
    };

    // Check immediately and after multiple delays (browsers autofill at different times)
    checkAutofill();
    const timer1 = setTimeout(checkAutofill, 100);
    const timer2 = setTimeout(checkAutofill, 300);
    const timer3 = setTimeout(checkAutofill, 500);

    // Listen for animationstart event (Chrome triggers this on autofill)
    const emailInput = emailRef.current;
    const passwordInput = passwordRef.current;

    const handleAnimationStart = () => {
      setTimeout(checkAutofill, 50);
    };

    if (emailInput) {
      emailInput.addEventListener("animationstart", handleAnimationStart);
    }
    if (passwordInput) {
      passwordInput.addEventListener("animationstart", handleAnimationStart);
    }

    // Also check when the page gains focus or input event occurs
    window.addEventListener("focus", checkAutofill);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      window.removeEventListener("focus", checkAutofill);
      if (emailInput) {
        emailInput.removeEventListener("animationstart", handleAnimationStart);
      }
      if (passwordInput) {
        passwordInput.removeEventListener(
          "animationstart",
          handleAnimationStart,
        );
      }
    };
  }, []);

  const onSubmit = async (data) => {
    const loginData = {
      username: data.username,
      password: data.password,
      role: data.role,
    };

    try {
      const result = await tokenManager.login(loginData);

      // Login successful - cookies are automatically set by the server
      login({ ...result.user, role: result.role });
      navigate(data.role === "student" ? "/student" : "/staff");
    } catch (error) {
      console.error("Error during login:", error);
      const errorMessage = error.response?.data?.message || "Network error";
      alert("Login failed: " + errorMessage);
    }
  };

  return (
    <div className='signin-contain'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h1>Sign In</h1>
        <p>
          Don't have an Account?{" "}
          <span onClick={() => navigate("/signup")}>Sign up</span>
        </p>
        <div className='input-area'>
          <div className='role-input2'>
            <label>
              <input
                {...register("role", { required: "Please select a role" })}
                type='radio'
                value='student'
              />{" "}
              Student
            </label>
            <label>
              <input
                {...register("role", { required: "Please select a role" })}
                type='radio'
                value='staff'
              />{" "}
              Staff
            </label>
            {errors.role && <p className='error'>{errors.role.message}</p>}
          </div>

          <div
            className={`input input-email ${
              emailFocused || emailValue ? "focused" : ""
            }`}
          >
            <label htmlFor='username' className='label email-label'>
              Email / UID
            </label>
            <input
              type='text'
              className='email'
              id='username'
              ref={emailRef}
              onFocus={handleEmailFocus}
              onBlur={handleEmailBlur}
              onChange={(e) => setEmailValue(e.target.value)}
              onInput={(e) => setEmailValue(e.target.value)}
              {...register("username", {
                required: "Email / UID is required",
              })}
            />
            {errors.username && (
              <p className='error'>{errors.username.message}</p>
            )}
            <span className='bottom-border'></span>
          </div>

          <div
            className={`input input-pass ${
              passwordFocused || passwordValue ? "focused" : ""
            }`}
          >
            <label htmlFor='password' className='label pass-label'>
              Password
            </label>
            <input
              type={eye ? "text" : "password"}
              className='pass'
              id='password'
              ref={passwordRef}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              onChange={(e) => setPasswordValue(e.target.value)}
              onInput={(e) => setPasswordValue(e.target.value)}
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 4,
                  message: "Password must be at least 4 characters",
                },
              })}
            />
            {errors.password && (
              <p className='error'>{errors.password.message}</p>
            )}
            <span className='bottom-border'></span>
          </div>

          <span className='forgot'>Forgot Password?</span>
        </div>

        <div className='submit-container'>
          <button type='submit' className='submit'>
            Login
          </button>
          <p>or</p>
          <div className='google'>
            <svg
              width='35px'
              height='35px'
              viewBox='0 0 32 32'
              xmlns='http://www.w3.org/2000/svg'
            >
              <path
                d='M23.75,16A7.7446,7.7446,0,0,1,8.7177,18.6259L4.2849,22.1721A13.244,13.244,0,0,0,29.25,16'
                fill='#00ac47'
              />
              <path
                d='M23.75,16a7.7387,7.7387,0,0,1-3.2516,6.2987l4.3824,3.5059A13.2042,13.2042,0,0,0,29.25,16'
                fill='#4285f4'
              />
              <path
                d='M8.25,16a7.698,7.698,0,0,1,.4677-2.6259L4.2849,9.8279a13.177,13.177,0,0,0,0,12.3442l4.4328-3.5462A7.698,7.698,0,0,1,8.25,16Z'
                fill='#ffba00'
              />
              <path
                d='M16,8.25a7.699,7.699,0,0,1,4.558,1.4958l4.06-3.7893A13.2152,13.2152,0,0,0,4.2849,9.8279l4.4328,3.5462A7.756,7.756,0,0,1,16,8.25Z'
                fill='#ea4435'
              />
              <path
                d='M29.25,15v1L27,19.5H16.5V14H28.25A1,1,0,0,1,29.25,15Z'
                fill='#4285f4'
              />
            </svg>
            <p>Sign in with Google</p>
          </div>
        </div>
      </form>

      <div className='signin-banner'></div>
    </div>
  );
}

export default Login;
