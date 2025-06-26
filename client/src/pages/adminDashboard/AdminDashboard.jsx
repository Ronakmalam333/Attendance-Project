import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from "../../context/AuthContext";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './adminDashboard.css';

function AdminDashboard() {
  const [summary, setSummary] = useState({ totalStudents: 0, totalRecords: 0, presentToday: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  

  const basePath = user?.role === "staff" ? "/staff" : "/student";


  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/attendance/summary', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSummary(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        }
        setLoading(false);
      }
    };
    fetchSummary();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-dashboard-container">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </div>
      {error && <div className="error-message">{error}</div>}
      <div className="dashboard-content">
        <div className="summary-section">
          <h2>Overview</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <div className="summary-cards">
              <div className="card">
                <h3>Total Students</h3>
                <p>{summary.totalStudents}</p>
              </div>
              <div className="card">
                <h3>Total Attendance Records</h3>
                <p>{summary.totalRecords}</p>
              </div>
              <div className="card">
                <h3>Present Today</h3>
                <p>{summary.presentToday}</p>
              </div>
            </div>
          )}
        </div>
        <div className="navigation-section">
          <h2>Navigation</h2>
          <div className="nav-links">
            <div className="nav-btn" onClick={() => {navigate(`${basePath}/attendence`);}}>
              View All Attendance
            </div>
            <div className="nav-btn" onClick={() => {navigate(`${basePath}/students`);}}>
              Manage Students
            </div>
            <div className="nav-btn">
              Generate Reports
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;