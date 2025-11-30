const express = require("express");

const controller = require("../../controllers/admin.controller");
const { getAuth } = require("../../middlewares/auth");
const router = express.Router();

router
  .route("/")
  .get(getAuth("master.admin"), controller.lists)
  .post(getAuth("master.admin"), controller.create);

router
  .route("/:adminId")
  /**
   * delete the single admin
   * */
  .delete(getAuth("master.admin"), controller.remove);

module.exports = router;
