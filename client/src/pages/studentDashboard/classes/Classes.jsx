import React, { useState } from 'react';
import './classes.css';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeSlots = [
  '9:15 - 10:15',
  '10:15 - 11:15',
  '11:15 - 12:15',
  'Lunch Break',
  '1:00 - 2:00',
  '2:00 - 3:00',
  '3:00 - 4:00',
];

// Timetable data (can be fetched or updated)
const initialTable = [
  ['FERAJ', 'FERAJ', 'Library', 'OOPIC', 'BENJ (Prac)', 'No Class'],
  ['BENJ', 'ES', 'ND (Prac)', 'ES', 'BENJ (Prac)', 'No Class'],
  ['ND', 'OOPIC', 'ND (Prac)', 'BENJ', 'OOPIC', 'No Class'],
  ['Lunch Break', 'Lunch Break', 'Lunch Break', 'Lunch Break', 'Lunch Break', 'Lunch Break'],
  ['OOPIC (Prac)', 'Library', 'Maths-II', 'FERAJ', 'Maths-II', 'No Class'],
  ['OOPIC (Prac)', 'Maths-II', 'SPORTS', 'FERAJ (Prac)', 'ND', 'No Class'],
  ['ND', 'SPORTS', 'Free Class', 'FERAJ (Prac)', 'BENJ', 'No Class'],
];

const subjects = [
  { name: "Back End Node JS", teacher: "Adil Ahmad" },
  { name: "Front End Using React, Angular JS", teacher: "Adil Ahmad" },
  { name: "OBJECT ORIENTED PROGRAMMING IN C++", teacher: "Ashutosh Pandey" },
  { name: "Environmental Science", teacher: "Dhruv Trivedi" },
  { name: "NoSQL Databases", teacher: "Sakshi Kasera" },
  { name: "Maths-II", teacher: "Vardan parmar" },
  { name: "Library", teacher: "Without teacher" },
  { name: "SPORTS", teacher: "Without teacher" },
];

function Classes() {
  const [timetable, setTimetable] = useState(initialTable);

  // !!!Optional !!! Handler for editing a cell in the future
  // const handleCellEdit = (rowIdx, colIdx, value) => {
  //   const updated = timetable.map((row, i) =>
  //     i === rowIdx ? row.map((cell, j) => (j === colIdx ? value : cell)) : row
  //   );
  //   setTimetable(updated);
  // };

  return (
    <div className="classes-contain">
      <header className="classes-header">
        <img src="https://www.raiuniversity.edu/wp-content/uploads//Rai-School-of-Engineering.png" alt="Rai University Logo" className="univ-logo" />
        <div>
          <h2>RAI SCHOOL OF ENGINEERING</h2>
          <div>Academic Year: 2024-25</div>
          <div>B.Tech CSE/IT Sem 2 Div A</div>
        </div>
      </header>

      <div className="timetable-wrapper">
        <table className="timetable">
          <thead>
            <tr>
              <th>Time/Day</th>
              {days.map(day => <th key={day}>{day}</th>)}
            </tr>
          </thead>
          <tbody>
            {timetable.map((row, rIdx) => (
              <tr key={rIdx}>
                <td className={timeSlots[rIdx] === 'Lunch Break' ? 'lunch-cell' : ''}>
                  {timeSlots[rIdx]}
                </td>
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={cell.toLowerCase().includes('lunch') ? 'lunch-cell' : ''}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="subjects-section">
        <h3>Subjects:</h3>
        <ul className="subjects-list">
          {subjects.map((sub, idx) => (
            <li key={idx}><strong>{sub.name}</strong> <span>({sub.teacher})</span></li>
          ))}
        </ul>
      </section>
      <footer className="classes-footer">
        <div>Timetable generated: 13-12-2024</div>
        <div className="footer-names">
          <span><strong>Time Table Coordinator</strong></span>
          <span><strong>Dean</strong></span>
        </div>
      </footer>
    </div>
  );
}

export default Classes;