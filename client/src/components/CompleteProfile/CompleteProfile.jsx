import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import "./CompleteProfile.css";

function CompleteProfile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const isStudent = user?.role === "student";
  const isStaff = user?.role === "staff";

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const profileData = isStudent
        ? {
            name: data.name,
            uid: data.uid,
            course: data.course,
            semester: data.semester,
          }
        : {
            // Staff only needs name and uid
            name: data.name,
            uid: data.uid,
          };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/profile`,
        profileData,
        {
          withCredentials: true,
        },
      );

      // Update user context with new profile data
      login({
        ...user,
        name: data.name,
        uid: data.uid,
        ...(isStudent && {
          course: data.course,
          semester: data.semester,
        }),
        profileCompleted: true,
      });

      alert("Profile completed successfully!");
      navigate(isStudent ? "/student" : "/staff");
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to update profile. Please try again.";
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='complete-profile-container'>
      <div className='complete-profile-card'>
        <h1>Complete Your Profile</h1>
        <p className='subtitle'>
          {isStudent
            ? "Please provide your full name, university ID, course, and semester information to continue"
            : "Please provide your full name and staff ID to continue"}
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className='profile-form'>
          <div className='form-group'>
            <label htmlFor='name'>Full Name</label>
            <input
              type='text'
              id='name'
              placeholder={
                isStudent ? "e.g., John Doe" : "e.g., Dr. Jane Smith"
              }
              defaultValue={user?.name !== "Pending" ? user?.name : ""}
              {...register("name", {
                required: "Full name is required",
                minLength: {
                  value: 3,
                  message: "Name must be at least 3 characters",
                },
                maxLength: {
                  value: 50,
                  message: "Name must not exceed 50 characters",
                },
              })}
              className={errors.name ? "error-input" : ""}
            />
            <small className='hint'>
              Enter your full name as per university records
            </small>
            {errors.name && (
              <p className='error-message'>{errors.name.message}</p>
            )}
          </div>

          <div className='form-group'>
            <label htmlFor='uid'>
              {isStudent ? "University ID (UID)" : "Staff ID"}
            </label>
            <input
              type='text'
              id='uid'
              placeholder={isStudent ? "e.g., 24BTCSE001" : "e.g., STAFF001"}
              {...register("uid", {
                required: `${isStudent ? "University" : "Staff"} ID is required`,
                pattern: {
                  value: /^[A-Z0-9]+$/i,
                  message: "ID should contain only letters and numbers",
                },
                minLength: {
                  value: 5,
                  message: "ID must be at least 5 characters",
                },
                maxLength: {
                  value: 20,
                  message: "ID must not exceed 20 characters",
                },
              })}
              className={errors.uid ? "error-input" : ""}
            />
            <small className='hint'>
              {isStudent
                ? "Enter your university-assigned ID (e.g., 24BTCSE001 for BTech CSE 2024)"
                : "Enter your staff ID assigned by the institution"}
            </small>
            {errors.uid && (
              <p className='error-message'>{errors.uid.message}</p>
            )}
          </div>

          {isStudent && (
            <>
              <div className='form-group'>
                <label htmlFor='course'>Course</label>
                <select
                  id='course'
                  {...register("course", {
                    required: "Please select your course",
                  })}
                  className={errors.course ? "error-input" : ""}
                >
                  <option value=''>Select Course</option>
                  <option value='BCA'>
                    BCA - Bachelor of Computer Applications
                  </option>
                  <option value='MCA'>
                    MCA - Master of Computer Applications
                  </option>
                  <option value='BTech'>BTech - Bachelor of Technology</option>
                  <option value='MTech'>MTech - Master of Technology</option>
                  <option value='BSc'>BSc - Bachelor of Science</option>
                  <option value='MSc'>MSc - Master of Science</option>
                  <option value='BBA'>
                    BBA - Bachelor of Business Administration
                  </option>
                  <option value='MBA'>
                    MBA - Master of Business Administration
                  </option>
                </select>
                {errors.course && (
                  <p className='error-message'>{errors.course.message}</p>
                )}
              </div>

              <div className='form-group'>
                <label htmlFor='semester'>Semester</label>
                <select
                  id='semester'
                  {...register("semester", {
                    required: "Please select your semester",
                  })}
                  className={errors.semester ? "error-input" : ""}
                >
                  <option value=''>Select Semester</option>
                  <option value='1'>Semester 1</option>
                  <option value='2'>Semester 2</option>
                  <option value='3'>Semester 3</option>
                  <option value='4'>Semester 4</option>
                  <option value='5'>Semester 5</option>
                  <option value='6'>Semester 6</option>
                  <option value='7'>Semester 7</option>
                  <option value='8'>Semester 8</option>
                </select>
                {errors.semester && (
                  <p className='error-message'>{errors.semester.message}</p>
                )}
              </div>
            </>
          )}

          <button type='submit' className='submit-button' disabled={loading}>
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
