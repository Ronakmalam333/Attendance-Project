import React, { useEffect, useState } from 'react';
import './students.css';

function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await fetch('http://localhost:5000/students');
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
    <div className='students-contain'>
      <h1>Students</h1>
      {loading && <p>Loading...</p>}
      {error && <div className='error'>{error}</div>}
      {!loading && !error && (
        <table className='students-table'>
          <thead>
            <tr>
              <th>Name</th>
              <th>UID</th>
              <th>Email</th>
              <th>Course</th>
              <th>Semester</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>No students found.</td>
              </tr>
            ) : (
              students.map((stu) => (
                <tr key={stu._id}>
                  <td>{stu.name}</td>
                  <td>{stu.uid}</td>
                  <td>{stu.email}</td>
                  <td>{stu.course}</td>
                  <td>{stu.semester}</td>
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