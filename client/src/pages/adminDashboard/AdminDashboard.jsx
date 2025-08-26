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

  const handleGenerateReport = () => {
    // Generate comprehensive attendance report
    const reportData = {
      totalStudents: summary.totalStudents,
      totalRecords: summary.totalRecords,
      presentToday: summary.presentToday,
      date: new Date().toLocaleDateString(),
      attendanceRate: summary.totalStudents > 0 ? ((summary.presentToday / summary.totalStudents) * 100).toFixed(1) : 0
    };
    
    const reportContent = `
ATTENDANCE REPORT
================
Date: ${reportData.date}
Total Students: ${reportData.totalStudents}
Total Records: ${reportData.totalRecords}
Present Today: ${reportData.presentToday}
Attendance Rate: ${reportData.attendanceRate}%
================
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/attendance/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Date,Student Name,UID,Subject,Faculty,Status\n"
        + response.data.map(record => 
            `${new Date(record.date).toLocaleDateString()},${record.studentName},${record.studentUid},${record.subject},${record.faculty},${record.status}`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `attendance-data-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data');
    }
  };

  const handleManageTokens = () => {
    // Simple token management - could be expanded
    const tokens = [
      { subject: 'Mathematics', token: 'MATH', active: true },
      { subject: 'Physics', token: 'PHYS', active: true },
      { subject: 'Chemistry', token: 'CHEM', active: false },
      { subject: 'Computer Science', token: 'COMP', active: true }
    ];
    
    const tokenList = tokens.map(t => `${t.subject}: ${t.token} (${t.active ? 'Active' : 'Inactive'})`).join('\n');
    alert(`Current Tokens:\n\n${tokenList}\n\nNote: Token management feature can be expanded with a dedicated interface.`);
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
            <div className="nav-btn" onClick={() => handleGenerateReport()}>
              📊 Generate Reports
            </div>
            <div className="nav-btn" onClick={() => handleExportData()}>
              📤 Export Data
            </div>
            <div className="nav-btn" onClick={() => handleManageTokens()}>
              🔑 Manage Tokens
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;