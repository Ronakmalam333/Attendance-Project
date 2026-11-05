import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import "./navbar.css";
import { AuthContext } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ThemeToggle from "../ThemeToggle";
import axios from "../../tokenManager";
import Icons from "../ui/Icons";
import Badge from "../ui/Badge";
import ConfirmModal from "../ui/ConfirmModal";

function Navbar({ sidebarCollapsed = false, onToggleSidebar }) {
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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

  const activeLink = currentLinks.find(isLinkActive);
  const activeLabel = activeLink
    ? activeLink.label
    : location.pathname.includes("profile")
    ? "Profile & Settings"
    : location.pathname.includes("aboutus")
    ? "About AMS"
    : location.pathname.includes("privacypolicy")
    ? "Governance Policy"
    : location.pathname.includes("feedback")
    ? "Feedback"
    : "Workspace";

  return (
    <>
      {/* =========================================================================
          DARK SLATE SIDEBAR (#1E293B)
          ========================================================================= */}
      <aside
        className={`erp-sidebar ${sidebarCollapsed ? "collapsed" : ""} ${
          mobileMenuOpen ? "mobile-open" : ""
        }`}
        aria-label="Primary Navigation"
      >
        {/* Brand header */}
        <div className="erp-sidebar-brand-wrapper">
          <Link to={basePath} className="erp-sidebar-brand">
            <div className="erp-sidebar-logo-mark">
              <Icons.Shield size={18} />
            </div>
            {!sidebarCollapsed && (
              <div className="erp-sidebar-brand-text">
                <span className="erp-sidebar-brand-name">AMS Enterprise</span>
                <span className="erp-sidebar-brand-status">
                  <span className="erp-status-dot" /> Live System
                </span>
              </div>
            )}
          </Link>
          {/* Mobile close button */}
          <button
            type="button"
            className="erp-sidebar-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Navigation"
          >
            <Icons.X size={18} />
          </button>
        </div>

        {/* Portal role badge */}
        {!sidebarCollapsed && (
          <div className="erp-sidebar-role-pill">
            <span className="erp-role-tag">
              {user?.role === "staff" ? "Faculty / Admin Portal" : "Student Academic Portal"}
            </span>
          </div>
        )}

        {/* Navigation items container */}
        <div className="erp-sidebar-nav-container">
          {!sidebarCollapsed ? (
            <div className="erp-sidebar-section-title">Core Workspace</div>
          ) : (
            <div className="erp-sidebar-divider" />
          )}

          <nav className="erp-sidebar-nav" aria-label="Portal Workspace Navigation">
            {currentLinks.map((item) => {
              const active = isLinkActive(item);
              const IconComp = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`erp-sidebar-nav-item ${active ? "active" : ""}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span className="erp-nav-icon-box">
                    <IconComp size={18} />
                  </span>
                  {!sidebarCollapsed && <span className="erp-nav-label">{item.label}</span>}
                  {active && <span className="erp-active-pip" />}
                </Link>
              );
            })}
          </nav>

          {!sidebarCollapsed ? (
            <div className="erp-sidebar-section-title" style={{ marginTop: "20px" }}>
              Governance & Support
            </div>
          ) : (
            <div className="erp-sidebar-divider" />
          )}

          <nav className="erp-sidebar-nav" aria-label="Support Navigation">
            <Link
              to={`${basePath}/profile`}
              className={`erp-sidebar-nav-item ${location.pathname.includes("/profile") ? "active" : ""}`}
              title={sidebarCollapsed ? "My Profile & Settings" : undefined}
            >
              <span className="erp-nav-icon-box">
                <Icons.User size={18} />
              </span>
              {!sidebarCollapsed && <span className="erp-nav-label">Profile & Settings</span>}
              {location.pathname.includes("/profile") && <span className="erp-active-pip" />}
            </Link>

            <Link
              to={`${basePath}/aboutus`}
              className={`erp-sidebar-nav-item ${location.pathname.includes("/aboutus") ? "active" : ""}`}
              title={sidebarCollapsed ? "About AMS" : undefined}
            >
              <span className="erp-nav-icon-box">
                <Icons.Info size={18} />
              </span>
              {!sidebarCollapsed && <span className="erp-nav-label">About AMS</span>}
              {location.pathname.includes("/aboutus") && <span className="erp-active-pip" />}
            </Link>

            <Link
              to={`${basePath}/privacypolicy`}
              className={`erp-sidebar-nav-item ${location.pathname.includes("/privacypolicy") ? "active" : ""}`}
              title={sidebarCollapsed ? "Governance & Policy" : undefined}
            >
              <span className="erp-nav-icon-box">
                <Icons.Shield size={18} />
              </span>
              {!sidebarCollapsed && <span className="erp-nav-label">Governance & Policy</span>}
              {location.pathname.includes("/privacypolicy") && <span className="erp-active-pip" />}
            </Link>

            <Link
              to={`${basePath}/feedback`}
              className={`erp-sidebar-nav-item ${location.pathname.includes("/feedback") ? "active" : ""}`}
              title={sidebarCollapsed ? "System Feedback" : undefined}
            >
              <span className="erp-nav-icon-box">
                <Icons.MessageSquare size={18} />
              </span>
              {!sidebarCollapsed && <span className="erp-nav-label">System Feedback</span>}
              {location.pathname.includes("/feedback") && <span className="erp-active-pip" />}
            </Link>
          </nav>
        </div>

        {/* Sidebar footer: User profile & Collapse button */}
        <div className="erp-sidebar-footer">
          <div className="erp-sidebar-user-block">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt={user?.name || "Avatar"}
                className="erp-sidebar-avatar-img"
              />
            ) : (
              <div className="erp-sidebar-avatar-fallback">
                {getInitials(user?.name || user?.username)}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="erp-sidebar-user-info">
                <span className="erp-sidebar-user-name">
                  {user?.name || user?.username || "Authenticated"}
                </span>
                <span className="erp-sidebar-user-role">
                  {user?.role === "staff" ? "Faculty Officer" : `Student • ${user?.uid || "Enrolled"}`}
                </span>
              </div>
            )}
          </div>

          <div className="erp-sidebar-footer-actions">
            <button
              type="button"
              className="erp-sidebar-signout-btn"
              onClick={() => setLogoutModalOpen(true)}
              title="Sign Out"
              aria-label="Sign Out"
            >
              <Icons.LogOut size={16} />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>

            {onToggleSidebar && (
              <button
                type="button"
                className="erp-sidebar-collapse-btn"
                onClick={onToggleSidebar}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                aria-label={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <Icons.ChevronRight size={15} /> : <Icons.ChevronLeft size={15} />}
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          className="erp-sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* =========================================================================
          TOP APP HEADER BAR (Surface #FFFFFF / Border #E2E8F0)
          ========================================================================= */}
      <header className="erp-topbar" role="banner">
        <div className="erp-topbar-inner">
          <div className="erp-topbar-left">
            {/* Mobile menu hamburger toggle */}
            <button
              type="button"
              className="erp-topbar-hamburger"
              aria-label="Open Navigation Drawer"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Icons.Menu size={20} />
            </button>

            {/* Desktop Sidebar Toggle Button */}
            {onToggleSidebar && (
              <button
                type="button"
                className="erp-topbar-desktop-toggle"
                onClick={onToggleSidebar}
                aria-label={sidebarCollapsed ? "Expand Navigation Sidebar" : "Collapse Navigation Sidebar"}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <Icons.ChevronRight size={16} /> : <Icons.ChevronLeft size={16} />}
              </button>
            )}

            {/* Breadcrumb indicator */}
            <div className="erp-topbar-breadcrumb">
              <span className="erp-breadcrumb-prefix">AMS Enterprise</span>
              <span className="erp-breadcrumb-sep">/</span>
              <span className="erp-breadcrumb-current">{activeLabel}</span>
            </div>
          </div>

          <div className="erp-topbar-right">
            {/* Operational Telemetry Chip */}
            <div className="erp-telemetry-chip">
              <span className="erp-telemetry-dot" />
              <span className="erp-telemetry-label">Operational</span>
            </div>

            {/* Theme Toggle */}
            <div className="erp-theme-wrapper">
              <ThemeToggle />
            </div>

            {/* Quick Profile Dropdown */}
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
                  <span className="erp-profile-uid">
                    {user?.uid || (user?.role === "staff" ? "Staff" : "Student")}
                  </span>
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
