const { verifyAccessToken, verifyRefreshToken, generateTokens, setTokenCookies } = require('./tokenUtils');

const authenticateToken = async (req, res, next) => {
  try {
    const accessToken = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    
    if (!accessToken) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = verifyAccessToken(accessToken);
    req.user = decoded;
    next();
  } catch (error) {
    // Try to refresh token if access token is expired
    const refreshToken = req.cookies?.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens({
        username: decoded.username,
        role: decoded.role
      });

      setTokenCookies(res, newAccessToken, newRefreshToken);
      req.user = decoded;
      next();
    } catch (refreshError) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };