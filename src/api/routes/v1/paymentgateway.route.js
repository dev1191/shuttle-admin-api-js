const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/paymentgateway.controller");
const { getAuth } = require("../../middlewares/auth");
const { offerValidation } = require("../../validations");

const router = express.Router();

router.route("/is-enabled").get(getAuth("master.admin"), controller.isEnabled);


router
  .route("/")
  .get(getAuth("master.admin"), controller.get);

  
router
  .route("/:paymentName")
  /**
   * update the single location
   * */
  .put(getAuth("master.admin"), controller.update);

module.exports = router;
