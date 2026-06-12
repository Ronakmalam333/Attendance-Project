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

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/profile`,
        {
          uid: data.uid,
          course: data.course,
          semester: data.semester,
        },
        {
          withCredentials: true,
        },
      );

      // Update user context with new profile data
      login({
        ...user,
        uid: data.uid,
        course: data.course,
        semester: data.semester,
        profileCompleted: true,
      });

      alert("Profile completed successfully!");
      navigate("/student");
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
          Please provide your university ID, course, and semester information to
          continue
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className='profile-form'>
          <div className='form-group'>
            <label htmlFor='uid'>University ID (UID)</label>
            <input
              type='text'
              id='uid'
              placeholder='e.g., 24BTCSE001'
              {...register("uid", {
                required: "University ID is required",
                pattern: {
                  value: /^[A-Z0-9]+$/i,
                  message: "UID should contain only letters and numbers",
                },
                minLength: {
                  value: 5,
                  message: "UID must be at least 5 characters",
                },
                maxLength: {
                  value: 20,
                  message: "UID must not exceed 20 characters",
                },
              })}
              className={errors.uid ? "error-input" : ""}
            />
            <small className='hint'>
              Enter your university-assigned ID (e.g., 24BTCSE001 for BTech CSE
              2024)
            </small>
            {errors.uid && (
              <p className='error-message'>{errors.uid.message}</p>
            )}
          </div>

          <div className='form-group'>
            <label htmlFor='course'>Course</label>
            <select
              id='course'
              {...register("course", { required: "Please select your course" })}
              className={errors.course ? "error-input" : ""}
            >
              <option value=''>Select Course</option>
              <option value='BCA'>
                BCA - Bachelor of Computer Applications
              </option>
              <option value='MCA'>MCA - Master of Computer Applications</option>
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

          <button type='submit' className='submit-button' disabled={loading}>
            {loading ? "Saving..." : "Complete Profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CompleteProfile;
