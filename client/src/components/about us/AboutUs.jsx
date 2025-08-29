import React from 'react';
import './aboutus.css';

const features = [
  {
    icon: "📱",
    title: "Real-time Tracking",
    description: "Instant attendance recording with geolocation verification",
    aria: "Mobile device"
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    description: "Comprehensive reports and data visualization tools",
    aria: "Bar chart"
  },
  {
    icon: "🔒",
    title: "Secure Platform",
    description: "Military-grade encryption and privacy protection",
    aria: "Lock"
  }
];

const teamMembers = [
  {
    name: "Anmol Sinha",
    role: "CO-Founder",
    photo: "/images/team/anmol.jpg", // Replace with actual path or URL
    alt: "Anmol Sinha photo"
  },
  {
    name: "Ronak Malam",
    role: "CO-Founder",
    photo: "/images/team/ronak.jpg",
    alt: "Ronak Malam photo"
  },
  {
    name: "Jugendra Kashyap",
    role: "CO-Founder",
    photo: "/images/team/jugendra.jpg",
    alt: "Jugendra Kashyap photo"
  }
];

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <header className="about-header">
        <h1>About CampusTrack</h1>
        <p className="tagline">Revolutionizing College Attendance Management</p>
      </header>

      <section className="content-section mission-section">
        <div className="section-header">
          <h2>Our Mission</h2>
          <div className="decorative-line"></div>
        </div>
        <p className="mission-statement">
          At CampusTrack, we're committed to transforming traditional attendance management 
          through innovative technology. Our goal is to streamline academic processes, 
          enhance student engagement, and provide real-time insights for educational institutions.
        </p>
      </section>

      <section className="content-section features-section">
        <div className="section-header">
          <h2>Key Features</h2>
          <div className="decorative-line"></div>
        </div>
        <div className="features-grid">
          {features.map((feat) => (
            <div className="feature-card" key={feat.title}>
              <div className="feature-icon" role="img" aria-label={feat.aria}>{feat.icon}</div>
              <h3>{feat.title}</h3>
              <p>{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section team-section">
        <div className="section-header">
          <h2>Our Team</h2>
          <div className="decorative-line"></div>
        </div>
        <div className="team-grid">
          {teamMembers.map((member) => (
            <div className="team-card" key={member.name}>
              <div
                className="team-photo"
                style={{ backgroundImage: `url(${member.photo})` }}
                role="img"
                aria-label={member.alt}
                title={member.name}
              ></div>
              <h3>{member.name}</h3>
              <p>{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section contact-section">
        <div className="section-header">
          <h2>Get in Touch</h2>
          <div className="decorative-line"></div>
        </div>
        <div className="contact-info">
          <p>
            📧 <a href="mailto:itzronakmalam94@gmail.com">itzronakmalam94@gmail.com</a>
          </p>
          <p>
            📞 <a href="tel:+918264983605">+91 8264983605</a>
          </p>
          <p>
            📍 Boy's Hostel, 
            [Rai University, Ahmedabad, Gujarat, India]
          </p>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;