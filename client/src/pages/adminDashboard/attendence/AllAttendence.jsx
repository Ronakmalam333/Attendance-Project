import React, { useState, useMemo, useEffect } from "react";
import ExcelJS from "exceljs";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import axios from "../../../tokenManager";
import { useToast } from "../../../context/ToastContext";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import Skeleton, { TableSkeleton } from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import "./allattendence.css";

const AllAttendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/attendance/all");
      const attendanceData = response.data || [];

      const transformedData = attendanceData.map((record) => ({
        _id: record._id,
        Name: record.studentName || (record.studentId && record.studentId.name) || "Student",
        RollNo: record.studentUid || (record.studentId && record.studentId.uid) || "N/A",
        Status: record.status || "Present",
        Date: new Date(record.date).toISOString().split("T")[0],
        Subject: record.subject || "General",
        Faculty: record.faculty || "Faculty",
        Time: record.time || "N/A",
      }));
      setData(transformedData);
    } catch (err) {
      toast.error("Error fetching master attendance ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handleCellEdit = (rowIndex, value) => {
    const updated = [...data];
    const prevStatus = updated[rowIndex].Status;
    updated[rowIndex].Status = value;
    setData(updated);
    toast.info(`Updated status for ${updated[rowIndex].Name} from ${prevStatus} to ${value}.`);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx)$/i)) {
      toast.warning("Please upload a valid .xlsx Excel workbook.", "Invalid File Format");
      return;
    }

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      const parsedData = [];

      worksheet.eachRow((row, rowIndex) => {
        if (rowIndex === 1) return;
        const [Name, RollNo, Status, Subject, Faculty] = row.values.slice(1);
        parsedData.push({
          Name: Name || "Student",
          RollNo: RollNo || "N/A",
          Status: Status || "Present",
          Date: new Date().toISOString().split("T")[0],
          Subject: Subject || "General",
          Faculty: Faculty || "Faculty",
          Time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        });
      });

      if (!parsedData.length || !parsedData[0].Name || !parsedData[0].Status) {
        throw new Error("File must contain at least Name and Status columns");
      }

      setData(parsedData);
      toast.success(`Imported ${parsedData.length} records from Excel sheet.`, "Upload Succeeded");
    } catch (error) {
      toast.error(error.message || "Failed to parse Excel workbook.");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (!data.length) {
      toast.warning("No attendance records to export.", "Empty Ledger");
      return;
    }

    setExporting(true);
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Master Attendance");

      worksheet.columns = [
        { header: "Date", key: "Date", width: 14 },
        { header: "Student Name", key: "Name", width: 24 },
        { header: "Institutional UID", key: "RollNo", width: 16 },
        { header: "Course Subject", key: "Subject", width: 22 },
        { header: "Faculty", key: "Faculty", width: 18 },
        { header: "Status", key: "Status", width: 14 },
      ];

      data.forEach((row) => worksheet.addRow(row));

      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1D4ED8" },
      };
      worksheet.getRow(1).alignment = { horizontal: "center", vertical: "middle" };

      const blob = await workbook.xlsx.writeBuffer();
      const blobFile = new Blob([blob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blobFile);
      link.download = `AMS-Master-Attendance-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Excel workbook generated and downloaded.", "Workbook Exported");
    } catch (err) {
      toast.error("Failed to generate Excel file.");
    } finally {
      setExporting(false);
    }
  };

  // Filtered rows
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      if (statusFilter !== "all" && row.Status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (row.Name || "").toLowerCase().includes(q);
        const matchRoll = (row.RollNo || "").toLowerCase().includes(q);
        const matchSub = (row.Subject || "").toLowerCase().includes(q);
        if (!matchName && !matchRoll && !matchSub) return false;
      }
      return true;
    });
  }, [data, statusFilter, searchQuery]);

  // Aggregate Metrics for chart
  const chartData = useMemo(() => {
    const summary = data.reduce((acc, row) => {
      const s = row.Status?.toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: "Present", value: summary.present || 0, color: "#059669" },
      { name: "Absent", value: summary.absent || 0, color: "#dc2626" },
      { name: "Late", value: summary.late || 0, color: "#d97706" },
    ].filter((d) => d.value > 0);
  }, [data]);

  return (
    <div className='erp-master-attendance-page'>
      {/* Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Master Attendance Ledger</h1>
          <p className='erp-page-subtitle'>
            Campus-wide attendance registry with live inline status overrides and Excel interoperability.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <label className='erp-btn erp-btn-secondary' style={{ cursor: "pointer", margin: 0 }}>
            <Icons.Plus size={15} />
            <span>Import Excel (.xlsx)</span>
            <input
              type='file'
              accept='.xlsx'
              onChange={handleFileUpload}
              disabled={loading}
              style={{ display: "none" }}
            />
          </label>
          <button
            type='button'
            onClick={handleExport}
            disabled={data.length === 0 || exporting}
            className='erp-btn erp-btn-secondary'
          >
            <Icons.Download size={15} />
            <span>{exporting ? "Generating..." : "Export Excel (.xlsx)"}</span>
          </button>
          <button
            type='button'
            onClick={fetchAttendanceData}
            disabled={loading}
            className='erp-btn erp-btn-ghost'
            title='Refresh Ledger'
          >
            <Icons.Refresh size={15} />
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className='erp-filter-toolbar erp-card'>
        <div className='erp-search-field-container'>
          <Icons.Search size={16} className='erp-search-icon' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by student name, roll number, or subject...'
            className='erp-search-input'
          />
        </div>

        <div className='erp-status-tabs'>
          {[
            { id: "all", label: "All Statuses" },
            { id: "present", label: "Present" },
            { id: "absent", label: "Absent" },
            { id: "late", label: "Late" },
          ].map((tab) => (
            <button
              key={tab.id}
              type='button'
              className={`erp-tab-btn ${statusFilter === tab.id ? "active" : ""}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Master Table + Analytics Breakdown */}
      <div className='erp-attendance-layout-grid'>
        <div className='erp-attendance-table-card erp-card'>
          <div className='erp-table-header-block'>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 className='erp-card-title'>Attendance Records ({filteredData.length})</h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Click status selector to override
              </span>
            </div>
          </div>

          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : filteredData.length === 0 ? (
            <EmptyState
              icon={Icons.Calendar}
              title='No attendance logs match criteria'
              description='Try altering your search or status filter options.'
            />
          ) : (
            <div className='erp-table-container'>
              <table className='erp-table'>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student Name</th>
                    <th>Roll / UID</th>
                    <th>Subject</th>
                    <th>Faculty</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, index) => {
                    const statusVariant =
                      row.Status?.toLowerCase() === "present"
                        ? "present"
                        : row.Status?.toLowerCase() === "absent"
                        ? "absent"
                        : "late";

                    return (
                      <tr key={index}>
                        <td className='tabular-nums text-muted'>{row.Date}</td>
                        <td style={{ fontWeight: 600, color: "var(--text-primary)" }}>{row.Name}</td>
                        <td>
                          <Badge variant='neutral' size='sm'>
                            {row.RollNo}
                          </Badge>
                        </td>
                        <td>{row.Subject}</td>
                        <td className='text-muted'>{row.Faculty}</td>
                        <td>
                          <select
                            value={row.Status}
                            onChange={(e) => handleCellEdit(index, e.target.value)}
                            className={`erp-status-select status-${statusVariant}`}
                          >
                            <option value='Present'>Present</option>
                            <option value='Absent'>Absent</option>
                            <option value='Late'>Late</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Analytics Breakdown Card */}
        <div className='erp-attendance-chart-card erp-card'>
          <h2 className='erp-card-title' style={{ marginBottom: "12px" }}>Ledger Breakdown</h2>
          {data.length === 0 ? (
            <div className='erp-chart-empty'>No records to chart</div>
          ) : (
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey='value'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {chartData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--bg-surface, #ffffff)",
                      borderColor: "var(--border-subtle, #e2e8f0)",
                      borderRadius: "6px",
                      fontSize: "12px",
                      color: "var(--text-primary, #0f172a)",
                    }}
                  />
                  <Legend
                    verticalAlign='bottom'
                    wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className='erp-ledger-stats-list'>
            <div className='erp-ledger-stat-item'>
              <span className='erp-ledger-stat-label'>Total Recorded Logs</span>
              <span className='erp-ledger-stat-num tabular-nums'>{data.length}</span>
            </div>
            <div className='erp-ledger-stat-item'>
              <span className='erp-ledger-stat-label'>Present Count</span>
              <span className='erp-ledger-stat-num tabular-nums' style={{ color: "var(--status-present)" }}>
                {data.filter((d) => d.Status?.toLowerCase() === "present").length}
              </span>
            </div>
            <div className='erp-ledger-stat-item'>
              <span className='erp-ledger-stat-label'>Absent Count</span>
              <span className='erp-ledger-stat-num tabular-nums' style={{ color: "var(--status-absent)" }}>
                {data.filter((d) => d.Status?.toLowerCase() === "absent").length}
              </span>
            </div>
            <div className='erp-ledger-stat-item'>
              <span className='erp-ledger-stat-label'>Late Count</span>
              <span className='erp-ledger-stat-num tabular-nums' style={{ color: "var(--status-late)" }}>
                {data.filter((d) => d.Status?.toLowerCase() === "late").length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllAttendance;
