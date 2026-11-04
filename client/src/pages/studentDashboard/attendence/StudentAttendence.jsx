import React, { useState, useMemo, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "../../../tokenManager";
import { useToast } from "../../../context/ToastContext";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import Skeleton, { TableSkeleton } from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import "./studentattendence.css";

const StudentAttendance = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const toast = useToast();

  useEffect(() => {
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await axios.get("/attendance/student");
      const attendanceData = response.data || [];

      const transformedData = attendanceData.map((record) => ({
        _id: record._id,
        Name: record.studentName,
        RollNo: record.studentUid,
        Status: record.status || "Present",
        Date: new Date(record.date).toISOString().split("T")[0],
        Subject: record.subject || "N/A",
        Faculty: record.faculty || "Faculty",
        Time: record.time || "N/A",
      }));
      setData(transformedData);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load attendance history.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((row) => {
      // Date filter
      if (dateRange.start && row.Date < dateRange.start) return false;
      if (dateRange.end && row.Date > dateRange.end) return false;

      // Status filter
      if (statusFilter !== "all" && row.Status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSub = (row.Subject || "").toLowerCase().includes(query);
        const matchFaculty = (row.Faculty || "").toLowerCase().includes(query);
        if (!matchSub && !matchFaculty) return false;
      }

      return true;
    });
  }, [data, dateRange, statusFilter, searchQuery]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = data.length;
    let present = 0;
    let absent = 0;
    let late = 0;

    data.forEach((r) => {
      const s = r.Status?.toLowerCase();
      if (s === "present") present++;
      else if (s === "absent") absent++;
      else if (s === "late") late++;
    });

    const rate = total > 0 ? ((present / total) * 100).toFixed(1) : "0.0";
    return { total, present, absent, late, rate };
  }, [data]);

  // Dynamic Course-Wise Breakdown derived strictly from real student records
  const courseSummary = useMemo(() => {
    if (!data.length) return [];
    const map = {};
    data.forEach((r) => {
      const sub = r.Subject || "General";
      if (!map[sub]) {
        map[sub] = {
          code: sub,
          faculty: r.Faculty || "Faculty",
          held: 0,
          attended: 0,
          absent: 0,
          late: 0,
        };
      }
      map[sub].held++;
      const s = (r.Status || "").toLowerCase();
      if (s === "present") map[sub].attended++;
      else if (s === "absent") map[sub].absent++;
      else if (s === "late") map[sub].late++;
    });
    return Object.values(map);
  }, [data]);

  // Dynamic distinct attendance dates
  const distinctPresentDays = useMemo(() => {
    if (!data.length) return 0;
    const dates = new Set(
      data.filter((r) => (r.Status || "").toLowerCase() === "present").map((r) => r.Date)
    );
    return dates.size;
  }, [data]);

  // Chart data
  const chartData = useMemo(() => {
    if (!filteredData.length) return [];
    const summary = filteredData.reduce((acc, row) => {
      const s = row.Status?.toLowerCase();
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    return [
      { name: "Present", value: summary.present || 0, color: "#10b981" },
      { name: "Absent", value: summary.absent || 0, color: "#ef4444" },
      { name: "Late", value: summary.late || 0, color: "#f59e0b" },
    ].filter((item) => item.value > 0);
  }, [filteredData]);

  const handleExportPDF = () => {
    if (!filteredData.length) {
      toast.warning("No attendance records to export.", "Export Empty");
      return;
    }

    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Official Student Attendance Transcript", 14, 18);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleDateString()} | Total Filtered Records: ${filteredData.length}`, 14, 25);
      doc.text(
        `Overall Attendance Rate: ${metrics.rate}% | Standing: ${
          parseFloat(metrics.rate) >= 75 ? "Compliant (>=75%)" : "Shortage (<75%)"
        }`,
        14,
        30
      );

      autoTable(doc, {
        head: [["Date", "Subject", "Faculty", "Time", "Status"]],
        body: filteredData.map((row) => [
          row.Date,
          row.Subject || "N/A",
          row.Faculty || "N/A",
          row.Time || "N/A",
          row.Status,
        ]),
        startY: 36,
        theme: "striped",
        headStyles: { fillColor: [29, 78, 216] },
      });

      doc.save(`AMS-Attendance-${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("Attendance transcript downloaded successfully.", "Export Complete");
    } catch (err) {
      toast.error("Failed to generate PDF document.");
    }
  };

  const resetFilters = () => {
    setDateRange({ start: "", end: "" });
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <div className='erp-attendance-page'>
      {/* Header & Controls */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>My Attendance Log & Transcript</h1>
          <p className='erp-page-subtitle'>
            Track academic presence, review compliance ratios, and export formal documentation.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type='button'
            onClick={handleExportPDF}
            disabled={filteredData.length === 0}
            className='erp-btn erp-btn-secondary'
          >
            <Icons.Download size={15} />
            <span>Export Official PDF</span>
          </button>
          <button
            type='button'
            onClick={fetchAttendanceData}
            disabled={loading}
            className='erp-btn erp-btn-ghost'
            title='Refresh Log'
          >
            <Icons.Refresh size={15} />
          </button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className='erp-kpi-grid'>
        <div className='erp-kpi-card erp-card'>
          <div className='erp-kpi-label'>Overall Attendance Rate</div>
          <div className='erp-kpi-value tabular-nums'>
            {metrics.rate}%
            <span
              className={`erp-kpi-badge ${
                parseFloat(metrics.rate) >= 75 ? "badge-good" : "badge-warn"
              }`}
            >
              {parseFloat(metrics.rate) >= 75 ? "Compliant (≥75%)" : "Shortage Risk (<75%)"}
            </span>
          </div>
          <div className='erp-progress-track'>
            <div
              className={`erp-progress-fill ${parseFloat(metrics.rate) >= 75 ? "fill-good" : "fill-warn"}`}
              style={{ width: `${Math.min(100, parseFloat(metrics.rate))}%` }}
            />
          </div>
        </div>

        <div className='erp-kpi-card erp-card'>
          <div className='erp-kpi-label'>Classes Attended</div>
          <div className='erp-kpi-value tabular-nums' style={{ color: "var(--status-present, #059669)" }}>
            {metrics.present}
            <span className='erp-kpi-subtext'>of {metrics.total} total sessions</span>
          </div>
        </div>

        <div className='erp-kpi-card erp-card'>
          <div className='erp-kpi-label'>Absences Logged</div>
          <div className='erp-kpi-value tabular-nums' style={{ color: "var(--status-absent, #dc2626)" }}>
            {metrics.absent}
            <span className='erp-kpi-subtext'>sessions missed</span>
          </div>
        </div>

        <div className='erp-kpi-card erp-card'>
          <div className='erp-kpi-label'>Late / Partial</div>
          <div className='erp-kpi-value tabular-nums' style={{ color: "var(--status-late, #d97706)" }}>
            {metrics.late}
            <span className='erp-kpi-subtext'>sessions late</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className='erp-filter-toolbar erp-card'>
        <div className='erp-search-field-container'>
          <Icons.Search size={16} className='erp-search-icon' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search subject or faculty name...'
            className='erp-search-input'
          />
        </div>

        {/* Status Filter Tabs */}
        <div className='erp-status-tabs'>
          {["all", "present", "absent", "late"].map((status) => (
            <button
              key={status}
              type='button'
              className={`erp-tab-btn ${statusFilter === status ? "active" : ""}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Date Range Inputs */}
        <div className='erp-date-range-container'>
          <div className='erp-date-input-group'>
            <span className='erp-date-prefix'>From</span>
            <input
              type='date'
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className='erp-date-picker'
            />
          </div>
          <div className='erp-date-input-group'>
            <span className='erp-date-prefix'>To</span>
            <input
              type='date'
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className='erp-date-picker'
            />
          </div>
          {(dateRange.start || dateRange.end || statusFilter !== "all" || searchQuery) && (
            <button
              type='button'
              className='erp-btn erp-btn-ghost'
              onClick={resetFilters}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Table & Chart */}
      <div className='erp-attendance-layout-grid'>
        {/* Table View */}
        <div className='erp-attendance-table-card erp-card'>
          <div className='erp-table-header-block'>
            <h2 className='erp-card-title'>Attendance Records ({filteredData.length})</h2>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={5} />
          ) : filteredData.length === 0 ? (
            <EmptyState
              icon={Icons.Calendar}
              title='No attendance records match your filters'
              description='Try adjusting your search query, status selector, or date range parameters.'
            />
          ) : (
            <div className='erp-table-container'>
              <table className='erp-table'>
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
                  {filteredData.map((row, index) => {
                    const statusVariant =
                      row.Status?.toLowerCase() === "present"
                        ? "present"
                        : row.Status?.toLowerCase() === "absent"
                        ? "absent"
                        : "late";

                    return (
                      <tr key={row._id || `${row.RollNo}-${row.Date}-${index}`}>
                        <td className='tabular-nums font-medium'>{row.Date}</td>
                        <td className='font-semibold'>{row.Subject}</td>
                        <td className='text-muted'>{row.Faculty}</td>
                        <td className='tabular-nums text-muted'>{row.Time}</td>
                        <td>
                          <Badge variant={statusVariant} size='sm'>
                            {row.Status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className='erp-table-pagination-footer'>
            <span className='erp-table-count-text'>
              Showing {filteredData.length} of {data.length} registered classroom records
            </span>
            <span className='erp-table-audit-label'>
              Ledger Hash Verified
            </span>
          </div>
        </div>

        {/* Analytics Breakdown Card */}
        <div className='erp-attendance-chart-card erp-card'>
          <h2 className='erp-card-title' style={{ marginBottom: "12px" }}>Status Distribution</h2>
          {filteredData.length === 0 ? (
            <div className='erp-chart-empty'>No data for distribution</div>
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
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
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

          <div className='erp-compliance-callout'>
            <Icons.Info size={16} className='erp-compliance-icon' />
            <p>
              University regulations require maintaining at least <strong>75%</strong> cumulative attendance across all registered courses.
            </p>
          </div>
        </div>
      </div>

      {/* Course-Wise Attendance Matrix & Exam Eligibility Table */}
      <div className='erp-card erp-course-matrix-card'>
        <div className='erp-section-header-row'>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Icons.BookOpen size={18} className='text-brand' />
              <h2 className='erp-card-title'>Course-Wise Attendance & Exam Eligibility Breakdown</h2>
            </div>
            <p className='erp-card-desc'>
              Dynamic subject attendance ratios and statutory thresholds computed from your active verified sessions.
            </p>
          </div>
          <Badge variant='brand'>Course Ledger</Badge>
        </div>

        {courseSummary.length === 0 ? (
          <div style={{ padding: "20px 0" }}>
            <EmptyState
              icon={Icons.BookOpen}
              title='No course-wise attendance recorded yet'
              description='When you submit classroom attendance tokens, your course-wise breakdown and exam standing will be calculated here.'
            />
          </div>
        ) : (
          <div className='erp-table-container' style={{ marginTop: "12px" }}>
            <table className='erp-table'>
              <thead>
                <tr>
                  <th>Course Code</th>
                  <th>Faculty In-Charge</th>
                  <th>Delivered</th>
                  <th>Attended</th>
                  <th>Attendance %</th>
                  <th>Minimum Req</th>
                  <th>Standing / Margin</th>
                </tr>
              </thead>
              <tbody>
                {courseSummary.map((c) => {
                  const pct = ((c.attended / c.held) * 100).toFixed(1);
                  const numPct = parseFloat(pct);
                  const isCompliant = numPct >= 75;
                  const isBorderline = numPct >= 70 && numPct < 75;
                  const margin = Math.max(0, Math.floor((c.attended - 0.75 * c.held) / 0.75));

                  return (
                    <tr key={c.code}>
                      <td className='tabular-nums font-semibold'>
                        <span className='erp-course-tag'>{c.code}</span>
                      </td>
                      <td className='text-muted'>{c.faculty}</td>
                      <td className='tabular-nums'>{c.held}</td>
                      <td className='tabular-nums font-semibold'>{c.attended}</td>
                      <td className='tabular-nums'>
                        <span
                          className={`font-bold ${
                            isCompliant ? "text-good" : isBorderline ? "text-warn" : "text-danger"
                          }`}
                        >
                          {pct}%
                        </span>
                      </td>
                      <td className='tabular-nums text-muted'>75.0%</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <Badge
                            variant={isCompliant ? "present" : isBorderline ? "late" : "absent"}
                            size='sm'
                          >
                            {isCompliant ? "Eligible for Exam" : isBorderline ? "Borderline" : "Shortage Warning"}
                          </Badge>
                          <span className='erp-margin-caption'>
                            {isCompliant ? `${margin} lectures margin` : "Attend next session mandatory"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Operational Consistency & Attendance Intelligence */}
      <div className='erp-attendance-insights-grid'>
        <div className='erp-card erp-insight-card'>
          <div className='erp-insight-icon'>
            <Icons.Clock size={20} />
          </div>
          <div className='erp-insight-data'>
            <span className='erp-insight-label'>Total Recorded Sessions</span>
            <div className='erp-insight-value tabular-nums'>{metrics.total}</div>
            <span className='erp-insight-sub'>Sessions logged in database</span>
          </div>
        </div>

        <div className='erp-card erp-insight-card'>
          <div className='erp-insight-icon' style={{ color: "var(--status-present, #10b981)" }}>
            <Icons.CheckCircle size={20} />
          </div>
          <div className='erp-insight-data'>
            <span className='erp-insight-label'>Active Present Days</span>
            <div className='erp-insight-value tabular-nums'>{distinctPresentDays} Days</div>
            <span className='erp-insight-sub'>Distinct attended session dates</span>
          </div>
        </div>

        <div className='erp-card erp-insight-card'>
          <div className='erp-insight-icon' style={{ color: "var(--brand-primary, #1d4ed8)" }}>
            <Icons.Calendar size={20} />
          </div>
          <div className='erp-insight-data'>
            <span className='erp-insight-label'>Attended Lectures</span>
            <div className='erp-insight-value tabular-nums'>{metrics.present}</div>
            <span className='erp-insight-sub'>Verified presence count</span>
          </div>
        </div>

        <div className='erp-card erp-insight-card'>
          <div className='erp-insight-icon' style={{ color: "var(--status-late, #f59e0b)" }}>
            <Icons.Shield size={20} />
          </div>
          <div className='erp-insight-data'>
            <span className='erp-insight-label'>Late / Missed Sessions</span>
            <div className='erp-insight-value tabular-nums'>{metrics.late + metrics.absent}</div>
            <span className='erp-insight-sub'>Irregular or missed slots</span>
          </div>
        </div>
      </div>

      {/* Formal Registrar Certification Footer */}
      <div className='erp-card erp-transcript-cert-card'>
        <div className='erp-cert-header'>
          <div className='erp-cert-crest'>
            <Icons.Shield size={22} />
          </div>
          <div className='erp-cert-text'>
            <h3>Office of the Academic Registrar • Electronic Attendance Transcript</h3>
            <p>
              This electronic record is generated directly from the AMS Academic Telemetry Database. The data reflected constitutes verified student attendance records pursuant to Section 4.2 of the University Academic Regulations.
            </p>
          </div>
        </div>
        <div className='erp-cert-footer-line'>
          <span>Audit Status: <strong>Telemetry Verified</strong></span>
          <span>•</span>
          <span>Student Identifier: <code>{data[0]?.RollNo || "STUDENT-UID"}</code></span>
          <span>•</span>
          <span>Generation Timestamp: <code className='tabular-nums'>{new Date().toLocaleString()}</code></span>
        </div>
      </div>
    </div>
  );
};

export default StudentAttendance;
