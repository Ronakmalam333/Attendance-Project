import React, { useContext, useState, useEffect } from 'react';
import './Profile.css';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from '../../tokenManager';

// ✅ Utility to normalize profile data safely
const normalizeProfile = (data = {}) => {
  const fullName = (data.name || '').trim();
  const parts = fullName.split(/\s+/).filter(Boolean);

  const firstname = data.firstname || parts[0] || '';
  const lastname = data.lastname || (parts.length > 1 ? parts.slice(1).join(' ') : '');

  return {
    ...data,
    firstname,
    lastname,
  };
};

const Profile = () => {
  const [profilePic, setProfilePic] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    name: '',
    email: '',
    uid: '',
    course: '',
    semester: ''
  });

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/profile');
        const normalized = normalizeProfile(response.data);
        setProfileData({
          firstname: normalized.firstname || '',
          lastname: normalized.lastname || '',
          name: normalized.name || '',
          email: normalized.email || '',
          uid: normalized.uid || '',
          course: normalized.course || '',
          semester: normalized.semester || ''
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error.response?.data?.message || error.message);
      }
    };

    fetchProfile();
  }, []);

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage('File size must be less than 5MB');
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setStatusMessage('Please select a valid image file');
        setTimeout(() => setStatusMessage(null), 3000);
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.onerror = () => {
        setStatusMessage('Error reading file');
        setTimeout(() => setStatusMessage(null), 3000);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogout = () => {
    logout();
    setProfileData({
      firstname: '',
      lastname: '',
      name: '',
      email: '',
      uid: '',
      course: '',
      semester: ''
    });
    setProfilePic(null);
    navigate('/'); // Redirect to login page after logout
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      let dataToSend = {
        ...profileData,
        name: `${profileData.firstname} ${profileData.lastname}`.trim()
      };
      delete dataToSend.firstname;
      delete dataToSend.lastname;

      const response = await axios.put('/profile', dataToSend);
      const result = response.data;

      setIsEditing(false);
      setStatusMessage('Profile updated successfully!');
      setTimeout(() => setStatusMessage(null), 3000);

      if (result.user) {
        const normalized = normalizeProfile(result.user);
        setProfileData({
          firstname: normalized.firstname || '',
          lastname: normalized.lastname || '',
          name: normalized.name || '',
          email: normalized.email || '',
          uid: normalized.uid || '',
          course: normalized.course || '',
          semester: normalized.semester || ''
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error.response?.data?.message || 'Error updating profile';
      setStatusMessage('Failed to update profile: ' + errorMessage);
      setTimeout(() => setStatusMessage(null), 3000);
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
              {`${profileData.firstname} ${profileData.lastname}`.trim() || profileData.name || 'User Name'}
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
            <input
              type='text'
              value={`${profileData.firstname || ''} ${profileData.lastname || ''}`.trim() || 'No name available'}
              readOnly
            />
          </div>

          <div className='profile-field'>
            <label>UID</label>
            <input type='text' value={profileData.uid || ''} readOnly />
          </div>

          <div className='profile-field'>
            <label>Email</label>
            <input type='text' value={profileData.email || ''} readOnly />
          </div>

          {user?.role === 'student' && (
            <>
              <div className='profile-field'>
                <label>Course</label>
                <input type='text' value={profileData.course || ''} readOnly />
              </div>
              <div className='profile-field'>
                <label>Semester</label>
                <input type='text' value={profileData.semester || ''} readOnly />
              </div>
            </>
          )}
        </div>

        {statusMessage && <p className="status">{statusMessage}</p>}

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
                  value={profileData.firstname || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className='profile-field'>
                <label>Last Name</label>
                <input
                  type='text'
                  name='lastname'
                  value={profileData.lastname || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className='profile-field'>
                <label>Email</label>
                <input
                  type='text'
                  name='email'
                  value={profileData.email || ''}
                  onChange={handleInputChange}
                  disabled={user?.role === 'staff'} // Staff cannot edit email
                />
              </div>
              {user?.role === 'student' && (
                <>
                  <div className='profile-field'>
                    <label>Course</label>
                    <input
                      type='text'
                      name='course'
                      value={profileData.course || ''}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className='profile-field'>
                    <label>Semester</label>
                    <input
                      type='text'
                      name='semester'
                      value={profileData.semester || ''}
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
