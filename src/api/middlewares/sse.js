module.exports = function sseHeaders(req, res, next) {
  // SSE standard headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  // Disable buffering in nginx
  res.setHeader('X-Accel-Buffering', 'no');
  // CORS is handled globally in config/express.js; do not set here to avoid duplication

  // Flush headers immediately (if supported)
  if (res.flushHeaders) res.flushHeaders();

  // Prevent socket timeouts for long-lived connections
  if (req.socket && req.socket.setTimeout) req.socket.setTimeout(0);

  return next();
};
