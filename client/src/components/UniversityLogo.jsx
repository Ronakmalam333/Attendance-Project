import React, { useState } from 'react';

const UniversityLogo = ({ 
  src = "https://www.raiuniversity.edu/wp-content/uploads/Rai-School-of-Engineering.png",
  alt = "University Logo",
  className = "",
  width = 90,
  height = 90,
  fallbackText = "RSE"
}) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (imageError) {
    return (
      <div 
        className={`logo-fallback ${className}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
      >
        <svg viewBox="0 0 100 100" width={width} height={height}>
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#logoGradient)" rx="10"/>
          <text 
            x="50" 
            y="60" 
            fontSize={fallbackText.length > 3 ? "24" : "36"} 
            fill="white" 
            textAnchor="middle" 
            fontWeight="bold"
            fontFamily="Arial, sans-serif"
          >
            {fallbackText}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={handleImageError}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        objectFit: 'contain'
      }}
    />
  );
};

export default UniversityLogo;
