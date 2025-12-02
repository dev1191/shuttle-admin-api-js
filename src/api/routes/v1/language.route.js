const express = require("express");
const Validate = require("../../middlewares/validator");
const controller = require("../../controllers/language.controller");
const { getAuth } = require("../../middlewares/auth");
const { languageValidation } = require("../../validations");

const router = express.Router();

router
  .route("/")
  .post(
    getAuth("language.create", "master.admin"),
    Validate(languageValidation.create),
    controller.create
  )
  .get(
    getAuth("language.view", "master.admin"),
    Validate(languageValidation.list),
    controller.list
  );

router.route("/load").get(controller.fetchLanguage);

router
  .route("/:languageId")
  .get(
    getAuth("language.edit", "master.admin"),
    Validate(languageValidation.get),
    controller.get
  )
  /**
   * update the single location
   * */
  .put(
    getAuth("language.edit", "master.admin"),
    Validate(languageValidation.update),
    controller.update
  )
  /**
   * delete  the single location
   * */

  .delete(
    getAuth("language.delete", "master.admin"),
    Validate(languageValidation.remove),
    controller.remove
  );

module.exports = router;
