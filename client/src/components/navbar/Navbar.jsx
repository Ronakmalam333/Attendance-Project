import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./navbar.css";
import { AuthContext } from "../../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { user } = useContext(AuthContext);

  const basePath = user?.role === "staff" ? "/staff" : "/student";

  const otherDetailsItems = [
    { path: `${basePath}/aboutus`, label: "About Us" },
    { path: `${basePath}/privacypolicy`, label: "Privacy Policy" },
    { path: `${basePath}/feedback`, label: "Feedback" },
  ];

  const activeIndex = otherDetailsItems.findIndex(
    (item) => location.pathname === item.path
  );
  const displayIndex = hoveredIndex !== -1 ? hoveredIndex : activeIndex;

  const dotPosition =
    displayIndex !== -1 ? `calc(${displayIndex * 33.33 + 16}% - 5px)` : "0";

  const mobileMenu = (
    <div
      className='mobile-menu-overlay'
      onClick={() => setMobileMenuOpen(false)}
    >
      <div className='mobile-menu' onClick={(e) => e.stopPropagation()}>
        <div className='mobile-menu-header'>
          <img src="https://avatars.githubusercontent.com/u/201213121?s=200&v=4" alt="Team-Logo" />
          <button
            className='mobile-menu-close'
            onClick={() => setMobileMenuOpen(false)}
          >
            &times;
          </button>
        </div>
        <div className='mobile-menu-section'>
          <div
            className='mobile-menu-item'
            onClick={() => {
              navigate(basePath);
              setMobileMenuOpen(false);
            }}
          >
            Home
          </div>
          <div
            className='mobile-menu-item'
            onClick={() => {
              navigate(`${basePath}/attendence`);
              setMobileMenuOpen(false);
            }}
          >
            Attendance
          </div>
          <div
            className='mobile-menu-item'
            onClick={() => {
              navigate(
                `${basePath}/${user?.role === "staff" ? "students" : "classes"}`
              );
              setMobileMenuOpen(false);
            }}
          >
            {user?.role === "staff" ? "Students" : "Classes"}
          </div>
        </div>
        <div className='mobile-menu-section'>
          {otherDetailsItems.map((item) => (
            <div
              key={item.path}
              className='mobile-menu-item'
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </div>
        <div className='mobile-menu-section'>
          <div
            className='mobile-menu-item'
            onClick={() => {
              navigate(`${basePath}/profile`);
              setMobileMenuOpen(false);
            }}
          >
            Profile
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className='nav-contain'>
        <button
          className={`hamburger${mobileMenuOpen ? " active" : ""}`}
          aria-label='Open menu'
          aria-expanded={mobileMenuOpen}
          aria-controls='mobile-nav'
          onClick={() => setMobileMenuOpen(true)}
          type='button'
        >
          <span className='hamburger-lines'>
            <span className='hamburger-line'></span>
            <span className='hamburger-line'></span>
            <span className='hamburger-line'></span>
          </span>
        </button>
        <div className='logo-container'>
          <img src="https://avatars.githubusercontent.com/u/201213121?s=200&v=4" alt="Team-Logo" />
        </div>
        <div className='menus'>
          <div className='menu-item' onClick={() => navigate(basePath)}>
            Home
          </div>
          <div
            className='menu-item'
            onClick={() => navigate(`${basePath}/attendence`)}
          >
            Attendance
          </div>
          <div
            className='menu-item'
            onClick={() =>
              navigate(
                `${basePath}/${user?.role === "staff" ? "students" : "classes"}`
              )
            }
          >
            {user?.role === "staff" ? "Students" : "Classes"}
          </div>
        </div>
        <div className='other-details'>
          {otherDetailsItems.map((item, index) => (
            <div
              key={item.path}
              className='other-details-item'
              onClick={() => navigate(item.path)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(-1)}
            >
              {item.label}
            </div>
          ))}
          <span
            className='dot'
            style={{
              left: dotPosition,
              opacity: displayIndex !== -1 ? 1 : 0,
            }}
          ></span>
        </div>
        <div
          className='account'
          onClick={() => navigate(`${basePath}/profile`)}
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            height='45px'
            viewBox='0 -960 960 960'
            width='45px'
            fill='#000000'
          >
            <path d='M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z' />
          </svg>
        </div>
      </div>
      {mobileMenuOpen && mobileMenu}
    </>
  );
}

export default Navbar;
