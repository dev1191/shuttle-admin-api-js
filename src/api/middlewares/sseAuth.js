const { getAuth } = require('./auth');

// SSE auth middleware factory — reads token from query string and delegates to getAuth
// Usage: sseAuth('maps.view', 'master.admin')
module.exports = (...permissions) => (req, res, next) => {
  try {
    const tokenParam = req.query && (req.query.token || req.query.access_token || req.query.auth);
    if (tokenParam) {
      // normalize to Bearer header
      const header = tokenParam.startsWith('Bearer ') ? tokenParam : `Bearer ${tokenParam}`;
      // set on headers so passport-jwt can pick it up
      req.headers = req.headers || {};
      req.headers.authorization = header;
    }
    // Delegate to existing getAuth middleware which uses passport
    return getAuth(...permissions)(req, res, next);
  } catch (err) {
    return next(err);
  }
};
