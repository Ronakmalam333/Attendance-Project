import React, { useEffect, useState, useMemo } from "react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  const toast = useToast();

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
      {/* Page Header */}
      <div className='erp-page-header'>
        <div>
          <h1 className='erp-page-title'>Enrolled Student Directory</h1>
          <p className='erp-page-subtitle'>
            Official student enrollment roster, academic credentials, and departmental groupings.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type='button'
            className='erp-btn erp-btn-secondary'
            onClick={handleExportCSV}
            disabled={filteredStudents.length === 0}
          >
            <Icons.Download size={15} />
            <span>Export Roster CSV</span>
          </button>
          <button
            type='button'
            className='erp-btn erp-btn-ghost'
            onClick={fetchStudents}
            title='Refresh roster'
            disabled={loading}
          >
            <Icons.Refresh size={15} />
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
            description='No records matched your search parameters. Try resetting filters.'
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;
