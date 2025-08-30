import React, { useEffect, useState } from 'react';
import './students.css';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:5000/students', {
          credentials: 'include',
        });
        const data = await response.json();
        if (response.ok) {
          setStudents(data);
        } else {
          setError(data.message || 'Failed to fetch students');
        }
      } catch (err) {
        setError('Failed to fetch students');
      }
      setLoading(false);
    };
    fetchStudents();
  }, []);

  return (
    <div className="students-contain" role="region" aria-label="Student List">
      <h1>Students</h1>
      {loading && <p className="loading" aria-live="polite">Loading...</p>}
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      {!loading && !error && (
        <table className="students-table" role="grid">
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">UID</th>
              <th scope="col">Email</th>
              <th scope="col">Course</th>
              <th scope="col">Semester</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }} aria-live="polite">
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((stu) => (
                <tr key={stu._id} tabIndex={0}>
                  <td data-label="Name">{stu.name}</td>
                  <td data-label="UID">{stu.uid}</td>
                  <td data-label="Email">{stu.email}</td>
                  <td data-label="Course">{stu.course}</td>
                  <td data-label="Semester">{stu.semester}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Students;