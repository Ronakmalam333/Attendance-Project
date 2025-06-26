import './Help.css';

const Help = () => {
  return (
    <div className='help-container'>
      <div className='support-title'>
        <h1>Help & Support</h1>
      </div>

      <div className='help-content'>
        <div className='faq-section'>
          <h2>Frequently Asked Questions</h2>
          <ul>
            <li>
              <strong>How do I reset my password?</strong>
              <p>You can reset your password by clicking on the "Forgot Password" link on the login page.</p>
            </li>
            <li>
              <strong>How do I contact support?</strong>
              <p>You can reach out to our support team via email at info@raiuniversity.edu</p>
            </li>
            <li>
              <strong>Where can I find my order history?</strong>
              <p>Your order history is available in the "My Account" section.</p>
            </li>
          </ul>
        </div>

        <div className='contact-section'>
          <h2>Contact Support</h2>
          <p>If you need further assistance, feel free to contact us:</p>
          <ul>
            <li>Email: info@raiuniversity.edu</li>
            <li>Phone: +91 8980004325</li>
            <li>Live Chat: Available 24/7</li>
          </ul>
          <button onClick={() => alert('Redirecting to live chat...')}>Start Live Chat</button>
        </div>
      </div>
    </div>
  );
};

export default Help;