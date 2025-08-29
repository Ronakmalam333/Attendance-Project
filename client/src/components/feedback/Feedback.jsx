import React, { useState } from 'react';
import './feedback.css';

function Feedback() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    //Submission logic to be added here....
    alert('Thank you for your feedback! 🌟');
    // Reset form
    setRating(0);
    setComment('');
  };

  return (
    <div className='feedback-contain'>
      <h1 className="feedback-title">Share Your Thoughts 💬</h1>
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="form-group">
          <label>Your Rating:</label>
          <div className="star-rating">
            {[...Array(5)].map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  type="button"
                  key={starValue}
                  className={`star ${starValue <= rating ? "on" : "off"}`}
                  onClick={() => setRating(starValue)}
                  onMouseEnter={(e) => e.target.classList.add('hover')}
                  onMouseLeave={(e) => e.target.classList.remove('hover')}
                >
                  <span className="star-icon">★</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="form-group">
          <label>Comments:</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What's on your mind?"
            maxLength="500"
          />
          <div className="char-counter">{comment.length}/500</div>
        </div>

        <button type="submit" className="submit-btn">
          <h3 className="btn-text">Submit Feedback 🚀</h3>
        </button>
      </form>
    </div>
  );
}

export default Feedback;