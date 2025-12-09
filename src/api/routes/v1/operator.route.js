const express = require("express");
const controller = require("../../controllers/operator.controller");
const { getAuth } = require("../../middlewares/auth");
const router = express.Router();

/**
 * Public routes
 */
// Operator registration (public)
router.route("/register").post(controller.register);

/**
 * Admin routes - Operator management
 */
router
  .route("/")
  .get(getAuth("master.admin"), controller.list) // List all operators
  .post(getAuth("master.admin"), controller.create); // Create operator

router
  .route("/:operatorId")
  .get(getAuth("master.admin"), controller.get) // Get single operator
  .put(getAuth("master.admin"), controller.update); // Update operator

router
  .route("/:operatorId/approve")
  .post(getAuth("master.admin"), controller.approve); // Approve operator

router
  .route("/:operatorId/reject")
  .post(getAuth("master.admin"), controller.reject); // Reject operator

router
  .route("/:operatorId/suspend")
  .post(getAuth("master.admin"), controller.suspend); // Suspend operator

/**
 * Operator routes - Self management
 */
router
  .route("/profile")
  .get(getAuth("operator"), controller.getProfile) // Get own profile
  .put(getAuth("operator"), controller.updateProfile); // Update own profile

router.route("/dashboard").get(getAuth("operator"), controller.getDashboard); // Get dashboard stats

router.route("/earnings").get(getAuth("operator"), controller.getEarnings); // Get earnings list

router
  .route("/payout/request")
  .post(getAuth("operator"), controller.requestPayout); // Request payout

module.exports = router;
