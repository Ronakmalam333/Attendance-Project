import React, { useState, useMemo, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from '../../../tokenManager';
import './studentattendence.css';

const StudentAttendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        // Check auth status first
        const authStatus = await axios.get('/auth/status');
        if (!authStatus.data.authenticated) {
          setError('Please log in to view attendance data');
          setLoading(false);
          return;
        }

        const response = await axios.get('/attendance/student');
        const attendanceData = response.data;
        
        // Transform data to match component expectations
        const transformedData = attendanceData.map(record => ({
          Name: record.studentName,
          RollNo: record.studentUid,
          Status: record.status,
          Date: new Date(record.date).toISOString().split('T')[0],
          Subject: record.subject,
          Faculty: record.faculty,
          Time: record.time
        }));
        setData(transformedData);
      } catch (err) {
        if (err.response?.status === 403) {
          setError('Access denied. Please ensure you are logged in as a student.');
        } else {
          setError('Error fetching attendance data');
        }
        console.error('Attendance fetch error:', err);
      }
      setLoading(false);
    };

    fetchAttendanceData();
  }, []);

  const filteredData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return data;
    return data.filter(
      (row) => row.Date >= dateRange.start && row.Date <= dateRange.end
    );
  }, [data, dateRange]);

  const chartData = useMemo(() => {
    if (!filteredData.length) return [];
    const summary = filteredData.reduce((acc, row) => {
      const status = row.Status?.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return ['present', 'absent', 'late'].map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: summary[status] || 0,
      color:
        status === 'present'
          ? '#4CAF50'
          : status === 'absent'
          ? '#FF5733'
          : '#FFC300',
    }));
  }, [filteredData]);

  const handleExportPDF = () => {
    if (!filteredData.length) {
      setError('No data available to export');
      return;
    }
    setError(null);
    const doc = new jsPDF();
    doc.text('My Attendance Report', 14, 15);
    autoTable(doc, {
      head: [['Date', 'Subject', 'Faculty', 'Time', 'Status']],
      body: filteredData.map((row) => [
        row.Date,
        row.Subject || 'N/A',
        row.Faculty || 'N/A',
        row.Time || 'N/A',
        row.Status,
      ]),
      startY: 25,
    });
    doc.save('my-attendance.pdf');
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  return (
    <div className="student-attendance-container">
      <div className="attendance-header">
        <h1>My Attendance</h1>
        <div className="controls">
          <div className="date-filter">
            <label>
              Start Date:
              <input
                type="date"
                name="start"
                value={dateRange.start}
                onChange={handleDateChange}
              />
            </label>
            <label>
              End Date:
              <input
                type="date"
                name="end"
                value={dateRange.end}
                onChange={handleDateChange}
              />
            </label>
          </div>
          <button
            onClick={handleExportPDF}
            disabled={filteredData.length === 0}
            className="export-btn"
          >
            Export to PDF
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="data-section">
        <div className="attendance-table">
          <h2>Attendance Records</h2>
          {loading ? (
            <p>Loading...</p>
          ) : filteredData.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, index) => (
                  <tr key={`${row.RollNo}-${row.Date}-${index}`}>
                    <td>{row.Date}</td>
                    <td>{row.Subject}</td>
                    <td>{row.Faculty}</td>
                    <td>{row.Time}</td>
                    <td className={`status ${row.Status.toLowerCase()}`}>{row.Status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No attendance data available</p>
          )}
        </div>

        <div className="attendance-chart">
          <h2>Attendance Summary</h2>
          <PieChart width={500} height={300}>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(1)}%`
              }
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>{value}</span>
              )}
            />
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;