const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/busschedule.controller");
const { getAuth } = require("../../middlewares/auth");

const router = express.Router();

router
  .route("/")
  .get(getAuth("bus-schedule.view", "master.admin"), controller.list)
  .post(getAuth("bus-schedule.create", "master.admin"), controller.create);

router
  .route("/list")
  .get(getAuth("bus-schedule.get", "master.admin"), controller.search);

router
  .route("/:busScheduleId/status")
  /**
   *  update status
   * * */
  .patch(getAuth("bus-schedule.update", "master.admin"), controller.status);

router
  .route("/:busScheduleId")
  .get(getAuth("bus-schedule.get", "master.admin"), controller.get)
  .put(getAuth("bus-schedule.update", "master.admin"), controller.update)

  .delete(getAuth("bus-schedule.delete", "master.admin"), controller.remove);

module.exports = router;
