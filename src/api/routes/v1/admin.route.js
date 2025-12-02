const express = require("express");
const Validate = require('../../middlewares/validator');
const controller = require("../../controllers/admin.controller");
const { getAuth } = require("../../middlewares/auth");
const { AdminValidation } = require('../../validations');
const router = express.Router();


router
  .route("/")
  .get(getAuth("master.admin"),Validate(AdminValidation.listAdmin),controller.lists)
  .post(getAuth("master.admin"), controller.create);

router
  .route("/:adminId")
  .put(getAuth("master.admin"), controller.update)
  /**
   * delete the single admin
   * */
  .delete(getAuth("master.admin"), controller.remove);

module.exports = router;
