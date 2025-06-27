import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import "./register.css";

const Register = () => {
  const [isCourseBox, setCourseBox] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm();

  const courseBox = (e) => {
    e.preventDefault();
    setCourseBox(true);
  };

  const hideCourseBox = (e) => {
    e.preventDefault();
    if (e.target.closest(".course-input-contain")) return;
    setCourseBox(false);
  };

  const handleBackButton = (e) => {
    e.preventDefault();
    setCourseBox(false);
  };

  const handleCourseSelect = (course) => {
    setSelectedCourse(course);
    setValue("course", course);
  };

  const handleSemesterSelect = (semester) => {
    setSelectedSemester(semester);
    setValue("semester", semester);
    setCourseBox(false);
  };

  const onSubmit = async (data) => {
    try {
      const endpoint = data.role === "student" ? "/student" : "/staff";
      const url = `http://localhost:5000${endpoint}`;

      const payload = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        uid: data.uid,
        password: data.password,
        role: data.role,
        ...(data.role === "student" && {
          course: data.course,
          semester: data.semester,
        }),
      };

      console.log("Sending payload:", payload);

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("Response status:", response.status);

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Expected JSON, but received: ${text.slice(0, 100)}...`
        );
      }

      const result = await response.json();

      if (response.ok) {
        alert(
          `${
            data.role === "student" ? "Student" : "Admin"
          } registered successfully!`
        );
        navigate("/signin");
      } else {
        throw new Error(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      alert(`Registration failed: ${error.message}`);
    }
  };

  const password = watch("password");
  const role = watch("role");

  return (
    <div className='register-container'>
      <div className='signup-img-contain'>
        {/* <img
          src='https://th.bing.com/th/id/OIP.4Jmh9M
3SoTkPtk1COE2mhwHaHa?pid=ImgDet&w=206&h=206&c=7&dpr=1.7&cb=idpwebp2&o=7&rm=3'
          alt='Signup'
        ></img> */}
      </div>

      <div className='signup'>
        <h1>Create Account</h1>
        <form className='register-form' onSubmit={handleSubmit(onSubmit)}>
          <div className='role-input'>
            <label>
              <input
                {...register("role", { required: "Please select a role" })}
                type='radio'
                value='student'
                defaultChecked
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

          <div className='input-group'>
            <input
              {...register("firstname", { required: "First name is required" })}
              type='text'
              placeholder='First Name'
              style={{
                border: `${
                  errors.firstname ? "2px solid red" : "2px solid #ddd"
                }`,
              }}
            />
            <input
              {...register("lastname", { required: "Last name is required" })}
              type='text'
              placeholder='Last Name'
              style={{
                border: `${
                  errors.lastname ? "2px solid red" : "2px solid #ddd"
                }`,
              }}
            />
            {errors.firstname && (
              <p className='error'>{errors.firstname.message}</p>
            )}
            {errors.lastname && (
              <p className='error'>{errors.lastname.message}</p>
            )}
          </div>

          <div className='input-group'>
            <input
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                  message: "Invalid email address",
                },
              })}
              type='email'
              placeholder='Email'
              style={{
                border: `${errors.email ? "2px solid red" : "2px solid #ddd"}`,
              }}
            />
            {errors.email && <p className='error'>{errors.email.message}</p>}
          </div>

          <div className='input-group'>
            <input
              {...register("uid", {
                required: "UID is required",
                minLength: {
                  value: 6,
                  message: "UID must be at least 6 characters",
                },
              })}
              type='text'
              placeholder='UID'
              style={{
                border: `${errors.uid ? "2px solid red" : "2px solid #ddd"}`,
              }}
            />
            {errors.uid && <p className='error'>{errors.uid.message}</p>}
          </div>

          {role === "student" && (
            <div className='input-group'>
              <button
                className='course-btn'
                onClick={courseBox}
                style={{
                  border: `${
                    errors.course || errors.semester
                      ? "2px solid red"
                      : "2px solid #ddd"
                  }`,
                }}
              >
                {selectedCourse || "Select Course"}
                {selectedSemester && ` - Sem ${selectedSemester}`}
                <span>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    height='24px'
                    viewBox='0 -960 960 960'
                    width='24px'
                    fill='#000000'
                  >
                    <path d='M480-344 240-584l56-56 184 184 184-184 56 56-240 240Z' />
                  </svg>
                </span>
              </button>
              {(errors.course || errors.semester) && (
                <p className='error'>
                  {errors.course?.message || errors.semester?.message}
                </p>
              )}

              <div
                className='course'
                onClick={hideCourseBox}
                style={{ display: `${isCourseBox ? "flex" : "none"}` }}
              >
                <div className='course-input-contain'>
                  <span
                    className='backToRegister'
                    style={{
                      position: "absolute",
                      top: "15px",
                      left: "15px",
                      cursor: "pointer",
                    }}
                    onClick={handleBackButton}
                  >
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      height='30px'
                      viewBox='0 -960 960 960'
                      width='30px'
                      fill='#000000'
                    >
                      <path d='M372.31-267.69 160-480l212.31-212.31L400.62-664l-164 164H800v40H236.62l164 164-28.31 28.31Z' />
                    </svg>
                  </span>

                  <input
                    {...register("course", {
                      required:
                        role === "student" ? "Course is required" : false,
                      validate: (value) =>
                        role !== "student" || !!value || "Course is required",
                    })}
                    type='hidden'
                    value={selectedCourse}
                  />
                  <input
                    {...register("semester", {
                      required:
                        role === "student" ? "Semester is required" : false,
                      validate: (value) =>
                        role !== "student" || !!value || "Semester is required",
                    })}
                    type='hidden'
                    value={selectedSemester}
                  />

                  <div className='courses'>
                    <div>
                      {[
                        "B-tech CSE",
                        "B-tech ME",
                        "B-tech ECE",
                        "B-tech Civil",
                        "MCA",
                        "MBA",
                      ].map((course) => (
                        <span
                          key={course}
                          onClick={(e) => {
                            e.preventDefault();
                            handleCourseSelect(course);
                          }}
                          className={
                            selectedCourse === course ? "selected" : ""
                          }
                        >
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className='sem'>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <span
                        key={sem}
                        onClick={(e) => {
                          e.preventDefault();
                          handleSemesterSelect(sem.toString());
                        }}
                        className={
                          selectedSemester === sem.toString() ? "selected" : ""
                        }
                      >
                        {sem}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className='input-group'>
            <input
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 4,
                  message: "Password must be at least 4 characters",
                },
              })}
              type='password'
              placeholder='Password'
              style={{
                border: `${
                  errors.password ? "2px solid red" : "2px solid #ddd"
                }`,
              }}
            />
            {errors.password && (
              <p className='error'>{errors.password.message}</p>
            )}
          </div>

          <div className='input-group'>
            <input
              {...register("confirmpassword", {
                required: "Confirm your password",
                validate: (value) =>
                  value === password || "Passwords do not match",
              })}
              type='password'
              placeholder='Confirm Password'
              style={{
                border: `${
                  errors.confirmpassword ? "2px solid red" : "2px solid #ddd"
                }`,
              }}
            />
            {errors.confirmpassword && (
              <p className='error'>{errors.confirmpassword.message}</p>
            )}
          </div>

          <button type='submit'>Register</button>
        </form>

        <div className='signin-btn'>
          Already Have An Account{" "}
          <span onClick={() => navigate("/signin")}>Sign In</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
