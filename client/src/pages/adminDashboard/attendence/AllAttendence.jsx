import React, { useState, useMemo, useEffect } from "react";
import ExcelJS from "exceljs";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import './allattendence.css';

const EditableTable = ({ data, onDataUpdate }) => {
  if (!data || data.length === 0) return <p>No attendance records.</p>;

  const handleCellEdit = (rowIndex, column, value) => {
    const newData = data.map((row, index) =>
      index === rowIndex ? { ...row, [column]: value } : row
    );
    onDataUpdate(newData);
  };

  return (
    <table>
      <thead>
        <tr>
          {Object.keys(data[0] || {}).map((key) => (
            <th key={key}>{key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={`${row.RollNo}-${rowIndex}`}>
            {Object.entries(row).map(([col, val]) => (
              <td key={col}>
                {col === "Status" ? (
                  <select
                    value={val}
                    onChange={(e) => handleCellEdit(rowIndex, col, e.target.value)}
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="Late">Late</option>
                  </select>
                ) : (
                  val
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const AttendanceChart = ({ data }) => {
  if (!data || data.length === 0) return <p>No data for chart.</p>;

  const chartData = useMemo(() => {
    const summary = data.reduce((acc, row) => {
      const status = row.Status?.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return ["present", "absent", "late"].map((status) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: summary[status] || 0,
      color:
        status === "present" ? "#4CAF50" :
        status === "absent" ? "#FF5733" :
        "#FFC300",
    }));
  }, [data]);

  if (chartData.every(d => d.value === 0)) return <p>No attendance to show.</p>;

  return (
    <PieChart width={500} height={300}>
      <Pie
        data={chartData}
        dataKey="value"
        nameKey="name"
        cx="50%"
        cy="50%"
        outerRadius={100}
        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
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
  );
};

const AllAttendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/attendance/all', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const attendanceData = await response.json();
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
        } else {
          setError('Failed to fetch attendance data');
        }
      } catch (err) {
        setError('Error fetching attendance data');
        console.error('Attendance fetch error:', err);
      }
      setLoading(false);
    };

    fetchAttendanceData();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx)$/i)) {
      setError("Please upload a valid .xlsx Excel file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const parsedData = [];

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return; // Skip header
        const [Name, RollNo, Status] = row.values.slice(1); // Ignore first null
        parsedData.push({ Name, RollNo, Status });
      });

      // Validate at least one good row
      if (!parsedData.length || !parsedData[0].Name || !parsedData[0].RollNo || !parsedData[0].Status) {
        throw new Error("File must contain Name, RollNo, and Status columns");
      }

      setData(parsedData);
    } catch (error) {
      console.error("Error processing file:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Attendance");

    // Header
    worksheet.columns = [
      { header: "Name", key: "Name", width: 20 },
      { header: "RollNo", key: "RollNo", width: 10 },
      { header: "Status", key: "Status", width: 15 }
    ];

    // Add data
    data.forEach(row => worksheet.addRow(row));

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { horizontal: 'center' };

    const blob = await workbook.xlsx.writeBuffer();
    const blobFile = new Blob([blob], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blobFile);
    link.download = "attendance.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h1>Student Attendance Tracker</h1>
        <div className="file-controls">
          <label className={`upload-btn ${loading ? "loading" : ""}`}>
            {loading ? "Processing..." : "Upload Excel"}
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileUpload}
              disabled={loading}
              hidden
            />
          </label>
          <button
            onClick={handleExport}
            disabled={data.length === 0}
            className="export-btn"
          >
            Export to Excel
          </button>
        </div>
        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="data-section">
        <div className="attendance-table">
          <h2>Attendance Records</h2>
          <EditableTable data={data} onDataUpdate={setData} />
        </div>

        <div className="attendance-chart">
          <h2>Attendance Distribution</h2>
          <AttendanceChart data={data} />
        </div>
      </div>
    </div>
  );
};

export default AllAttendance;