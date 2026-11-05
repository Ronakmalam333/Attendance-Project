import React, { useEffect, useState, useMemo, useRef } from "react";
import ExcelJS from "exceljs";
import api from "../../../tokenManager";
import { useToast } from "../../../context/ToastContext";
import Icons from "../../../components/ui/Icons";
import Badge from "../../../components/ui/Badge";
import Skeleton, { TableSkeleton } from "../../../components/ui/Skeleton";
import EmptyState from "../../../components/ui/EmptyState";
import "./students.css";

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    uid: "",
    email: "",
    course: "B.Tech Computer Science",
    semester: "1",
    password: "",
  });
  const fileInputRef = useRef(null);
  const toast = useToast();

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.uid.trim() || !formData.email.trim()) {
      toast.warning("Name, UID, and Email are mandatory.", "Required Fields");
      return;
    }

    setIsAdding(true);
    try {
      const res = await api.post("/students", formData);
      toast.success(res.data?.message || "Student enrolled successfully.", "Student Enrolled");
      if (res.data.student) {
        setStudents((prev) => [res.data.student, ...prev]);
      } else {
        fetchStudents();
      }
      setFormData({
        name: "",
        uid: "",
        email: "",
        course: "B.Tech Computer Science",
        semester: "1",
        password: "",
      });
      setShowAddModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to enroll student.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteStudent = async (id, name, uid) => {
    if (!window.confirm(`Are you sure you want to delete student "${name}" (${uid})? All linked attendance ledger records will also be permanently removed.`)) {
      return;
    }

    const prevStudents = [...students];
    setStudents((prev) => prev.filter((s) => s._id !== id));

    try {
      await api.delete(`/students/${id}`);
      toast.success(`Student ${name} (${uid}) removed from roster.`);
    } catch (err) {
      setStudents(prevStudents);
      toast.error(err.response?.data?.message || "Failed to delete student record.");
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get("/students");
      setStudents(response.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to fetch student directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Distinct courses and semesters
  const availableCourses = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.course) set.add(s.course);
    });
    return Array.from(set);
  }, [students]);

  const availableSemesters = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.semester) set.add(s.semester.toString());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered dataset
  const filteredStudents = useMemo(() => {
    return students.filter((stu) => {
      if (courseFilter !== "all" && stu.course !== courseFilter) return false;
      if (semesterFilter !== "all" && stu.semester?.toString() !== semesterFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (stu.name || "").toLowerCase().includes(q);
        const matchUid = (stu.uid || "").toLowerCase().includes(q);
        const matchEmail = (stu.email || "").toLowerCase().includes(q);
        if (!matchName && !matchUid && !matchEmail) return false;
      }

      return true;
    });
  }, [students, courseFilter, semesterFilter, searchQuery]);

  // Bulk Excel (.xlsx) / CSV Ingestion
  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.warning("Please upload a valid .xlsx or .csv workbook.", "Invalid File Format");
      return;
    }

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);

      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        throw new Error("No worksheets found in uploaded file.");
      }

      // Detect header row
      const headerRow = worksheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNumber) => {
        headers[colNumber] = String(cell.value || "").trim().toLowerCase();
      });

      const parsedStudents = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip headers

        let name = "";
        let uid = "";
        let email = "";
        let course = "General";
        let semester = "1";

        row.eachCell((cell, colNumber) => {
          const h = headers[colNumber] || "";
          const val = cell.value != null ? String(cell.value).trim() : "";

          if (h.includes("name")) name = val;
          else if (h.includes("uid") || h.includes("roll") || h.includes("enroll") || h.includes("id")) uid = val;
          else if (h.includes("email") || h.includes("mail")) email = val;
          else if (h.includes("course") || h.includes("branch") || h.includes("degree") || h.includes("dept")) course = val;
          else if (h.includes("sem")) semester = val;
        });

        // Fallback positional if headers weren't named standard
        if (!name && row.getCell(1).value) name = String(row.getCell(1).value).trim();
        if (!uid && row.getCell(2).value) uid = String(row.getCell(2).value).trim();
        if (!email && row.getCell(3).value) email = String(row.getCell(3).value).trim();
        if (course === "General" && row.getCell(4).value) course = String(row.getCell(4).value).trim();
        if (semester === "1" && row.getCell(5).value) semester = String(row.getCell(5).value).trim();

        if (name || uid || email) {
          parsedStudents.push({ name, uid, email, course, semester });
        }
      });

      if (parsedStudents.length === 0) {
        throw new Error("No student records detected in workbook. Check file format.");
      }

      toast.info(`Parsed ${parsedStudents.length} rows. Uploading to database...`, "Ingesting Roster");

      const response = await api.post("/api/students/bulk-import", { students: parsedStudents });
      toast.success(response.data.message || `Successfully imported ${parsedStudents.length} students!`, "Import Complete");

      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to parse and import Excel file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Download Sample Template for University Administrators
  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Students");

      worksheet.columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "UID", key: "uid", width: 18 },
        { header: "Email", key: "email", width: 30 },
        { header: "Course", key: "course", width: 25 },
        { header: "Semester", key: "semester", width: 12 },
      ];

      // Format header row
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE2E8F0" },
      };

      // Add sample rows
      worksheet.addRow({
        name: "Ronak Malam",
        uid: "24BTCSE001",
        email: "ronak.m@university.edu",
        course: "Computer Science & Engineering",
        semester: "4",
      });
      worksheet.addRow({
        name: "Alex Johnson",
        uid: "24BTCSE002",
        email: "alex.j@university.edu",
        course: "Computer Science & Engineering",
        semester: "4",
      });
      worksheet.addRow({
        name: "Sophia Martinez",
        uid: "24BTCSE003",
        email: "sophia.m@university.edu",
        course: "Computer Science & Engineering",
        semester: "4",
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "AMS-Student-Roster-Template.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Excel template downloaded. Populate and upload anytime.", "Template Ready");
    } catch (err) {
      toast.error("Failed to generate Excel template.");
    }
  };

  const handleExportCSV = () => {
    if (!filteredStudents.length) {
      toast.warning("No student records to export.", "Empty Roster");
      return;
    }

    const headers = ["Name", "UID", "Email", "Course", "Semester"];
    const rows = filteredStudents.map((s) => [
      `"${s.name || ""}"`,
      `"${s.uid || ""}"`,
      `"${s.email || ""}"`,
      `"${s.course || ""}"`,
      `"${s.semester || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Students-Directory-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filteredStudents.length} student records to CSV.`);
  };

  const getInitials = (name) => {
    if (!name) return "S";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className='erp-students-page'>
      {/* Hidden File Input for Excel Import */}
      <input
        ref={fileInputRef}
        type='file'
        accept='.xlsx,.xls,.csv'
        style={{ display: "none" }}
        onChange={handleExcelUpload}
      />

      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Enrolled Student Directory</h1>
          <p className='erp-page-subtitle'>
            Official student enrollment roster, academic credentials, and departmental groupings.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Add Student Button */}
          <button
            type='button'
            className='erp-btn erp-btn-primary erp-btn-sm'
            onClick={() => setShowAddModal(true)}
          >
            <Icons.Plus size={14} />
            <span>Add Student</span>
          </button>

          {/* Download Template Button */}
          <button
            type='button'
            className='erp-btn erp-btn-ghost erp-btn-sm'
            onClick={handleDownloadTemplate}
            title='Download pre-formatted Excel template'
          >
            <Icons.Download size={14} />
            <span>Excel Template</span>
          </button>

          {/* Import Excel Button */}
          <button
            type='button'
            className='erp-btn erp-btn-secondary erp-btn-sm'
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={importing}
          >
            <Icons.Upload size={14} />
            <span>{importing ? "Importing Roster..." : "Import Excel (.xlsx)"}</span>
          </button>

          {/* Export CSV Button */}
          <button
            type='button'
            className='erp-btn erp-btn-secondary erp-btn-sm'
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
          >
            <Icons.Download size={14} />
            <span>Export CSV</span>
          </button>

          {/* Refresh Button */}
          <button
            type='button'
            className='erp-btn erp-btn-ghost erp-btn-sm'
            onClick={fetchStudents}
            title='Refresh roster'
            disabled={loading}
          >
            <Icons.Refresh size={14} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className='erp-filter-toolbar erp-card'>
        <div className='erp-search-field-container'>
          <Icons.Search size={16} className='erp-search-icon' />
          <input
            type='text'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search by student name, UID, or university email...'
            className='erp-search-input'
          />
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {/* Course filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className='erp-select'
            style={{ width: "auto", minWidth: "160px" }}
          >
            <option value='all'>All Courses / Degrees</option>
            {availableCourses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Semester filter */}
          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className='erp-select'
            style={{ width: "auto", minWidth: "140px" }}
          >
            <option value='all'>All Semesters</option>
            {availableSemesters.map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>

          {(searchQuery || courseFilter !== "all" || semesterFilter !== "all") && (
            <button
              type='button'
              className='erp-btn erp-btn-ghost'
              onClick={() => {
                setSearchQuery("");
                setCourseFilter("all");
                setSemesterFilter("all");
              }}
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table Card */}
      <div className='erp-students-table-card erp-card'>
        <div className='erp-table-header-block'>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 className='erp-card-title'>Students Roster ({filteredStudents.length})</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Total in DB: {students.length}
            </span>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={Icons.Users}
            title='No students found'
            description='No records matched your search parameters. You can import students via Excel or add new records.'
          />
        ) : (
          <div className='erp-table-container'>
            <table className='erp-table'>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Institutional UID</th>
                  <th>Email Address</th>
                  <th>Course / Degree</th>
                  <th>Semester</th>
                  <th style={{ width: "60px", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((stu) => (
                  <tr key={stu._id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className='erp-student-mini-avatar'>
                          {getInitials(stu.name)}
                        </div>
                        <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                          {stu.name || "Student"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <Badge variant='neutral' size='sm'>
                        {stu.uid || "N/A"}
                      </Badge>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{stu.email}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{stu.course || "Not Assigned"}</span>
                    </td>
                    <td>
                      <span className='tabular-nums'>
                        {stu.semester ? `Semester ${stu.semester}` : "N/A"}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type='button'
                        className='erp-btn erp-btn-ghost erp-btn-xs'
                        style={{ color: "var(--color-danger, #f43f5e)", padding: "4px" }}
                        onClick={() => handleDeleteStudent(stu._id, stu.name, stu.uid)}
                        title={`Remove ${stu.name} from roster`}
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Single Student Modal Dialog */}
      {showAddModal && (
        <div
          role='dialog'
          aria-modal='true'
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(6, 8, 12, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddModal(false);
          }}
        >
          <div
            className='erp-card'
            style={{
              width: "100%",
              maxWidth: "500px",
              background: "var(--bg-surface, #14171d)",
              border: "1px solid var(--border-color, #282d38)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4)",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 className='erp-card-title' style={{ fontSize: "1.15rem", marginBottom: "4px" }}>
                  Enroll New Student
                </h3>
                <p className='erp-card-desc' style={{ fontSize: "0.82rem" }}>
                  Register an individual student record directly into the institution database.
                </p>
              </div>
              <button
                type='button'
                className='erp-btn erp-btn-ghost erp-btn-xs'
                onClick={() => setShowAddModal(false)}
                title='Close'
              >
                <Icons.X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                  Full Name *
                </label>
                <input
                  type='text'
                  required
                  placeholder='e.g., Jane Doe'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='erp-input'
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                    Roll No / UID *
                  </label>
                  <input
                    type='text'
                    required
                    placeholder='e.g., 24BTCSE015'
                    value={formData.uid}
                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    className='erp-input'
                    style={{ width: "100%", textTransform: "uppercase" }}
                  />
                </div>
                <div>
                  <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                    Semester *
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    className='erp-select'
                    style={{ width: "100%" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                  Institutional Email *
                </label>
                <input
                  type='email'
                  required
                  placeholder='e.g., jane.doe@university.edu'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='erp-input'
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                  Degree / Program
                </label>
                <input
                  type='text'
                  placeholder='e.g., B.Tech Computer Science'
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  className='erp-input'
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label className='erp-label' style={{ fontSize: "0.8rem", marginBottom: "6px", display: "block" }}>
                  Initial Password (Optional - defaults to UID)
                </label>
                <input
                  type='password'
                  placeholder='Leave blank to use UID as initial password'
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className='erp-input'
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type='button'
                  className='erp-btn erp-btn-secondary'
                  onClick={() => setShowAddModal(false)}
                  disabled={isAdding}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='erp-btn erp-btn-primary'
                  disabled={isAdding}
                >
                  {isAdding ? "Enrolling..." : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Students;
