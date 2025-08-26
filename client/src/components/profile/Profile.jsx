import React, { useContext, useState, useEffect } from 'react';
import './Profile.css';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    name: '',
    email: '',
    uid: '',
    course: '',
    semester: ''
  });
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5000/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          // Split name for both staff and students
          const [firstname, ...rest] = (data.name || '').split(' ');
          setProfileData({
            ...data,
            firstname: firstname || '',
            lastname: rest.join(' ') || '',
          });
        } else {
          console.error('Failed to fetch profile:', data.message);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (user && token) {
      fetchProfile();
    }
  }, [user, token]);

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/'); // Redirect to login page after logout
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      let dataToSend = { ...profileData };
      // Combine firstname and lastname into name for both roles
      dataToSend.name = `${profileData.firstname} ${profileData.lastname}`.trim();
      delete dataToSend.firstname;
      delete dataToSend.lastname;
      const response = await fetch('http://localhost:5000/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });
      const result = await response.json();
      if (response.ok) {
        setIsEditing(false);
        alert('Profile updated successfully!');
        // Update profileData with any changes returned from backend
        if (result.user?.name) {
          const [firstname, ...rest] = result.user.name.split(' ');
          setProfileData({
            ...result.user,
            firstname: firstname || '',
            lastname: rest.join(' ') || '',
          });
        } else {
          setProfileData(result.user);
        }
      } else {
        alert('Failed to update profile: ' + result.message);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  return (
    <div className="profile-contain">
      <div className='profile'>
        <div className='profile-header'>
          <label htmlFor='profile-upload' className='profile-pic-label'>
            <input
              type='file'
              id='profile-upload'
              accept='image/*'
              onChange={handleProfilePicChange}
              hidden
            />
            {profilePic ? (
              <img src={profilePic} alt='Profile' className='profile-pic' />
            ) : (
              <span className='profile-icon'>
                <svg xmlns='http://www.w3.org/2000/svg' height='40px' viewBox='0 -960 960 960' width='40px' fill='#000000'>
                  <path d='M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z' />
                </svg>
              </span>
            )}
          </label>
          <div className='profile-info'>
            <h2>
              {user?.role === "staff"
                ? `${profileData.firstname} ${profileData.lastname}`.trim()
                : `${profileData.firstname} ${profileData.lastname}`.trim()}
            </h2>
            <p>{profileData.email}</p>
          </div>
          <button className='edit-button' onClick={() => setIsEditing(true)}>
            Edit
          </button>
        </div>

        <div className='profile-details'>
          <div className='profile-field'>
            <label>Full Name</label>
            <input type='text'
              value={
                user?.role === "staff"
                  ? `${profileData.firstname} ${profileData.lastname}`.trim()
                  : `${profileData.firstname} ${profileData.lastname}`.trim()
              }
              readOnly
            />
          </div>

          <div className='profile-field'>
            <label>UID</label>
            <input type='text' value={profileData.uid} readOnly />
          </div>

          <div className='profile-field'>
            <label>Email</label>
            <input type='text' value={profileData.email} readOnly />
          </div>

          {user?.role === 'student' && (
            <>
              <div className='profile-field'>
                <label>Course</label>
                <input type='text' value={profileData.course} readOnly />
              </div>
              <div className='profile-field'>
                <label>Semester</label>
                <input type='text' value={profileData.semester} readOnly />
              </div>
            </>
          )}
        </div>

        <button className='logout-button' onClick={handleLogout}>
          Logout
        </button>

        {isEditing && (
          <div className='edit-overlay' onClick={() => setIsEditing(false)}>
            <div className='edit-popup' onClick={(e) => e.stopPropagation()}>
              <h2>Edit Profile</h2>
              <div className='profile-field'>
                <label>First Name</label>
                <input
                  type='text'
                  name='firstname'
                  value={profileData.firstname}
                  onChange={handleInputChange}
                />
              </div>
              <div className='profile-field'>
                <label>Last Name</label>
                <input
                  type='text'
                  name='lastname'
                  value={profileData.lastname}
                  onChange={handleInputChange}
                />
              </div>
              <div className='profile-field'>
                <label>Email</label>
                <input
                  type='text'
                  name='email'
                  value={profileData.email}
                  onChange={handleInputChange}
                  readOnly={user?.role === 'staff'} // Staff cannot edit email
                />
              </div>
              {user?.role === 'student' && (
                <>
                  <div className='profile-field'>
                    <label>Course</label>
                    <input
                      type='text'
                      name='course'
                      value={profileData.course}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='profile-field'>
                    <label>Semester</label>
                    <input
                      type='text'
                      name='semester'
                      value={profileData.semester}
                      onChange={handleInputChange}
                    />
                  </div>
                </>
              )}
              <button className='done-button' onClick={handleSave}>
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;