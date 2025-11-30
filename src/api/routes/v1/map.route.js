const express = require('express');
const controller = require('../../controllers/managemap.controller');
const {
  authorize,
  getAuth,
  LOGGED_USER,
} = require('../../middlewares/auth');
const sseHeaders = require('../../middlewares/sse');
const sseAuth = require('../../middlewares/sseAuth');


const router = express.Router();


router
  .route('/data')
  .get(getAuth('master.admin'), controller.driverData);

// SSE stream for live driver tracking
// Use sseAuth to accept token in query params (e.g. ?token=...) then set SSE headers
router.get('/stream', sseAuth('master.admin'), sseHeaders, controller.stream);




module.exports = router;
