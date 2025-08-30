import React, { useState, useEffect } from 'react';
import axios from '../../../tokenManager';
import './attendanceMarking.css';

function AttendanceMarking() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTokens, setActiveTokens] = useState([]);

  useEffect(() => {
    fetchActiveTokens();
  }, []);

  const fetchActiveTokens = async () => {
    try {
      const response = await axios.get('/tokens/active');
      setActiveTokens(response.data);
    } catch (error) {
      console.error('Error fetching active tokens:', error);
      setActiveTokens([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      showMessage('Please enter a token', 'error');
      return;
    }

    setLoading(true);
    try {
      // Check authentication first
      const authCheck = await axios.get('/auth/status');
      if (!authCheck.data.authenticated) {
        showMessage('Please log in to submit attendance', 'error');
        setLoading(false);
        return;
      }

      if (authCheck.data.user.role !== 'student') {
        showMessage('Only students can submit attendance', 'error');
        setLoading(false);
        return;
      }

      const response = await axios.post('/attendance/submit', {
        token: token.toUpperCase(),
        subject: 'AUTO_DETECT'
      });

      showMessage(response.data.message, 'success');
      setToken('');
      fetchActiveTokens();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to submit attendance';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    const timeoutId = setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
    return () => clearTimeout(timeoutId);
  };

  const handleTokenInput = (e) => {
    let value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (value.length > 4) {
      value = value.substring(0, 4);
    }
    setToken(value);
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="attendance-marking">
      <div className="header">
        <h1>Mark Attendance</h1>
        <div className="current-time">
          Current Time: {getCurrentTime()}
        </div>
      </div>

      <div className="attendance-form-container">
        <form onSubmit={handleSubmit} className="attendance-form">
          <div className="form-group">
            <label htmlFor="token">Enter Attendance Token:</label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={handleTokenInput}
              placeholder="e.g., EX7G"
              maxLength="4"
              className="token-input"
              disabled={loading}
              autoComplete="off"
            />
            <small className="input-help">
              Enter the 4-character token provided by your faculty
            </small>
          </div>

          <button 
            type="submit" 
            className={`submit-btn ${loading ? 'loading' : ''}`}
            disabled={loading || !token.trim()}
          >
            {loading ? 'Submitting...' : 'Mark Attendance'}
          </button>
        </form>

        {message && (
          <div className={`message ${messageType}`}>
            {message}
          </div>
        )}
      </div>

      <div className="active-sessions">
        <h2>Active Sessions</h2>
        {activeTokens.length === 0 ? (
          <div className="no-sessions">
            No active attendance sessions at the moment
          </div>
        ) : (
          <div className="sessions-grid">
            {activeTokens.map(tokenData => (
              <div key={tokenData._id} className="session-card">
                <div className="session-header">
                  <h3>{tokenData.subject}</h3>
                  <span className="faculty">{tokenData.faculty}</span>
                </div>
                <div className="session-details">
                  <div className="time-info">
                    <span>Valid until: {new Date(tokenData.validUntil).toLocaleTimeString()}</span>
                  </div>
                  <div className="usage-info">
                    <span>Students attended: {tokenData.currentUsage}/{tokenData.maxUsage}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceMarking;