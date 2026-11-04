import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./navbar.css";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ThemeToggle from "../ThemeToggle";
import axios from "../../tokenManager";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import ConfirmModal from "../ui/ConfirmModal";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user, logout } = useContext(AuthContext);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const basePath = user?.role === "staff" ? "/staff" : "/student";

  // Fetch profile picture if user logged in
  useEffect(() => {
    let isMounted = true;
    const fetchProfilePicture = async () => {
      try {
        const response = await axios.get("/profile");
        if (isMounted && response.data.profilePicture) {
          setProfilePicture(response.data.profilePicture);
        }
      } catch (error) {
        // Silently ignore 401s or profile load error
      }
    };

    if (user) {
      fetchProfilePicture();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setLogoutModalOpen(false);
    try {
      await logout();
      toast.info("You have signed out securely.", "Logged Out");
      navigate("/");
    } catch (err) {
      toast.error("Logout encounter an error.");
    }
  };

  // Student navigation links
  const studentLinks = [
    { path: "/student", label: "Overview", icon: Icons.Home, exact: true },
    { path: "/student/mark-attendance", label: "Check-in", icon: Icons.CheckSquare },
    { path: "/student/attendence", label: "Attendance Log", icon: Icons.Calendar },
    { path: "/student/classes", label: "Timetable", icon: Icons.Clock },
  ];

  // Staff navigation links
  const staffLinks = [
    { path: "/staff", label: "Executive Dashboard", icon: Icons.Home, exact: true },
    { path: "/staff/tokens", label: "Token Generator", icon: Icons.Key },
    { path: "/staff/students", label: "Student Directory", icon: Icons.Users },
    { path: "/staff/attendence", label: "Attendance Master", icon: Icons.Calendar },
  ];

  const currentLinks = user?.role === "staff" ? staffLinks : studentLinks;

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <header className="erp-navbar" role="banner">
        <div className="erp-navbar-inner">
          {/* Mobile hamburger button */}
          <button
            type="button"
            className="erp-hamburger-btn"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Icons.Menu size={20} />
          </button>

          {/* Institutional Brand */}
          <Link to={basePath} className="erp-brand-container">
            <div className="erp-brand-logo-mark">
              <Icons.Shield size={18} />
            </div>
            <div className="erp-brand-text-block">
              <span className="erp-brand-name">AMS Enterprise</span>
              <span className="erp-brand-status">
                <span className="erp-status-dot" /> Live System
              </span>
            </div>
          </Link>

          {/* Role Pill */}
          <div className="erp-role-pill-wrapper">
            {user?.role === "staff" ? (
              <Badge variant="brand" size="sm">
                Faculty / Admin
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">
                Student Portal
              </Badge>
            )}
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="erp-nav-links" aria-label="Main Navigation">
            {currentLinks.map((item) => {
              const active = isLinkActive(item);
              const IconComp = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`erp-nav-item ${active ? "active" : ""}`}
                >
                  <IconComp size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Utilities */}
          <div className="erp-nav-actions">
            {/* Quick Links Menu */}
            <div className="erp-nav-secondary-links">
              <Link to={`${basePath}/aboutus`} className="erp-utility-link">
                About
              </Link>
              <Link to={`${basePath}/privacypolicy`} className="erp-utility-link">
                Policy
              </Link>
              <Link to={`${basePath}/feedback`} className="erp-utility-link">
                Feedback
              </Link>
            </div>

            {/* Theme Toggle */}
            <div className="erp-theme-wrapper">
              <ThemeToggle />
            </div>

            {/* User Profile Dropdown */}
            <div className="erp-profile-dropdown-container" ref={dropdownRef}>
              <button
                type="button"
                className="erp-profile-trigger"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                aria-expanded={profileDropdownOpen}
                aria-label="User account menu"
              >
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={user?.name || "User Avatar"}
                    className="erp-avatar-img"
                  />
                ) : (
                  <div className="erp-avatar-fallback">
                    {getInitials(user?.name || user?.username)}
                  </div>
                )}
                <div className="erp-profile-name-block">
                  <span className="erp-profile-name">{user?.name || user?.username || "Account"}</span>
                  <span className="erp-profile-uid">{user?.uid || (user?.role === "staff" ? "Staff" : "Student")}</span>
                </div>
                <Icons.ChevronDown size={14} className="erp-chevron-icon" />
              </button>

              {profileDropdownOpen && (
                <div className="erp-dropdown-menu" role="menu">
                  <div className="erp-dropdown-header">
                    <p className="erp-dropdown-user-name">{user?.name || user?.username}</p>
                    <p className="erp-dropdown-user-email">{user?.email || "Academic User"}</p>
                    <div style={{ marginTop: "6px" }}>
                      <Badge variant={user?.role === "staff" ? "brand" : "neutral"} size="sm">
                        {user?.role === "staff" ? "Administrative Access" : "Student Access"}
                      </Badge>
                    </div>
                  </div>

                  <div className="erp-dropdown-divider" />

                  <Link
                    to={`${basePath}/profile`}
                    className="erp-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Icons.User size={15} />
                    <span>My Profile & Settings</span>
                  </Link>

                  <Link
                    to={`${basePath}/feedback`}
                    className="erp-dropdown-item"
                    role="menuitem"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <Icons.MessageSquare size={15} />
                    <span>Support & Feedback</span>
                  </Link>

                  <div className="erp-dropdown-divider" />

                  <button
                    type="button"
                    className="erp-dropdown-item erp-dropdown-logout"
                    role="menuitem"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setLogoutModalOpen(true);
                    }}
                  >
                    <Icons.LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="erp-mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
            <div className="erp-mobile-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="erp-mobile-header">
                <div className="erp-brand-container">
                  <div className="erp-brand-logo-mark">
                    <Icons.Shield size={18} />
                  </div>
                  <span className="erp-brand-name">AMS Enterprise</span>
                </div>
                <button
                  type="button"
                  className="erp-mobile-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <Icons.X size={18} />
                </button>
              </div>

              <div className="erp-mobile-nav-list">
                <div className="erp-mobile-section-label">Portal Navigation</div>
                {currentLinks.map((item) => {
                  const active = isLinkActive(item);
                  const IconComp = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`erp-mobile-link ${active ? "active" : ""}`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <IconComp size={18} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <div className="erp-mobile-section-label" style={{ marginTop: "16px" }}>
                  Resources & Help
                </div>
                <Link
                  to={`${basePath}/profile`}
                  className="erp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icons.User size={18} />
                  <span>Profile & Account</span>
                </Link>
                <Link
                  to={`${basePath}/aboutus`}
                  className="erp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icons.Info size={18} />
                  <span>About AMS</span>
                </Link>
                <Link
                  to={`${basePath}/privacypolicy`}
                  className="erp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icons.Shield size={18} />
                  <span>Privacy Policy</span>
                </Link>
                <Link
                  to={`${basePath}/feedback`}
                  className="erp-mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icons.MessageSquare size={18} />
                  <span>System Feedback</span>
                </Link>
              </div>

              <div className="erp-mobile-footer">
                <button
                  type="button"
                  className="erp-btn erp-btn-secondary"
                  style={{ width: "100%", justifyContent: "center" }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setLogoutModalOpen(true);
                  }}
                >
                  <Icons.LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={logoutModalOpen}
        title="Sign Out of AMS"
        message="Are you sure you want to log out of your session? You will need your credentials to log back in."
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutModalOpen(false)}
      />
    </>
  );
}

export default Navbar;
