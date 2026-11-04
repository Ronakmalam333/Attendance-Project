import React from "react";
import { Outlet, Link } from "react-router-dom";
import Navbar from "../navbar/Navbar";
import Icons from "../ui/Icons";
import "./layout.css";

function NavbarLayout() {
  return (
    <div className='erp-layout-wrapper'>
      <Navbar />
      <main className='erp-layout-main'>
        <Outlet />
      </main>
      <footer className='erp-layout-footer'>
        <div className='erp-footer-inner'>
          <div className='erp-footer-left'>
            <span className='erp-footer-pulse-dot' />
            <span className='erp-footer-telemetry-text'>
              AMS Institutional Telemetry • <span className='text-highlight'>Session Authenticated</span> • Status: Operational
            </span>
          </div>

          <div className='erp-footer-center'>
            <span className='erp-footer-author'>
              System Architect & Lead Developer: <strong className='erp-author-name'>Ronak Malam</strong>
            </span>
          </div>

          <div className='erp-footer-right'>
            <div className='erp-footer-nav-links'>
              <Link to='aboutus' className='erp-footer-link'>About</Link>
              <span className='erp-footer-sep'>•</span>
              <Link to='privacypolicy' className='erp-footer-link'>Governance</Link>
              <span className='erp-footer-sep'>•</span>
              <Link to='feedback' className='erp-footer-link'>Feedback</Link>
            </div>
            <span className='erp-footer-version-tag'>v2.4.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default NavbarLayout;
