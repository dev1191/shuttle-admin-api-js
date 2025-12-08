const express = require("express");
const { validate } = require("express-validation");
const controller = require("../../controllers/emailtemplate.controller");
const validation = require("../../validations/emailtemplate.validation");
const { getAuth } = require("../../middlewares/auth");

const router = express.Router();

/**
 * Load user when API with userId route parameter is hit
 */
// router.param('userId', controller.load);

router
  .route("/")
  /**
   * @api {get} v1/email-templates List Email Templates
   * @apiDescription Get a list of email templates
   * @apiVersion 1.0.0
   * @apiName ListEmailTemplates
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {Number{1-}}         [page=1]     List page
   * @apiParam  {Number{1-100}}      [perPage=20] Email templates per page
   * @apiParam  {String}             [search]     Search in name, slug, subject
   * @apiParam  {String}             [event_type] Filter by event type
   * @apiParam  {Boolean}            [is_active]  Filter by active status
   *
   * @apiSuccess {Object[]} data List of email templates
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(
    getAuth("master.admin"),
    validate(validation.listEmailTemplates),
    controller.list
  )
  /**
   * @api {post} v1/email-templates Create Email Template
   * @apiDescription Create a new email template
   * @apiVersion 1.0.0
   * @apiName CreateEmailTemplate
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             name          Template name
   * @apiParam  {String}             slug          Unique slug
   * @apiParam  {String}             subject       Email subject
   * @apiParam  {String}             body          Email body (HTML)
   * @apiParam  {String}             event_type    Event type
   * @apiParam  {String[]}           [variables]   Template variables
   * @apiParam  {Boolean}            [is_active]   Active status
   * @apiParam  {String}             [description] Template description
   *
   * @apiSuccess (Created 201) {Object} data Created email template
   *
   * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users can create the data
   * @apiError (Forbidden 403)     Forbidden        Only admins can create the data
   */
  .post(
    getAuth("master.admin"),
    validate(validation.createEmailTemplate),
    controller.create
  );

router
  .route("/slug/:slug")
  /**
   * @api {get} v1/email-templates/slug/:slug Get Email Template by Slug
   * @apiDescription Get email template information by slug
   * @apiVersion 1.0.0
   * @apiName GetEmailTemplateBySlug
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiSuccess {Object} data Email template data
   *
   * @apiError (Not Found 404)    NotFound     Email template does not exist
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only admins can access the data
   */
  .get(
    getAuth("master.admin"),
    validate(validation.getEmailTemplateBySlug),
    controller.getBySlug
  );

router
  .route("/:id")
  /**
   * @api {get} v1/email-templates/:id Get Email Template
   * @apiDescription Get email template information
   * @apiVersion 1.0.0
   * @apiName GetEmailTemplate
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiSuccess {Object} data Email template data
   *
   * @apiError (Not Found 404)    NotFound     Email template does not exist
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only admins can access the data
   */
  .get(
    getAuth("master.admin"),
    validate(validation.getEmailTemplate),
    controller.get
  )
  /**
   * @api {patch} v1/email-templates/:id Update Email Template
   * @apiDescription Update email template
   * @apiVersion 1.0.0
   * @apiName UpdateEmailTemplate
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {String}             [name]        Template name
   * @apiParam  {String}             [slug]        Unique slug
   * @apiParam  {String}             [subject]     Email subject
   * @apiParam  {String}             [body]        Email body (HTML)
   * @apiParam  {String}             [event_type]  Event type
   * @apiParam  {String[]}           [variables]   Template variables
   * @apiParam  {Boolean}            [is_active]   Active status
   * @apiParam  {String}             [description] Template description
   *
   * @apiSuccess {Object} data Updated email template
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Not Found 404)    NotFound         Email template does not exist
   * @apiError (Unauthorized 401) Unauthorized     Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden        Only admins can modify the data
   */
  .patch(
    getAuth("master.admin"),
    validate(validation.updateEmailTemplate),
    controller.update
  )
  /**
   * @api {delete} v1/email-templates/:id Delete Email Template
   * @apiDescription Delete email template
   * @apiVersion 1.0.0
   * @apiName DeleteEmailTemplate
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiSuccess (No Content 204)  Successfully deleted
   *
   * @apiError (Not Found 404)    NotFound     Email template does not exist
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can delete the data
   * @apiError (Forbidden 403)    Forbidden    Only admins can delete the data
   */
  .delete(
    getAuth("master.admin"),
    validate(validation.deleteEmailTemplate),
    controller.remove
  );

router
  .route("/:id/toggle-status")
  /**
   * @api {post} v1/email-templates/:id/toggle-status Toggle Email Template Status
   * @apiDescription Toggle email template active status
   * @apiVersion 1.0.0
   * @apiName ToggleEmailTemplateStatus
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiSuccess {Object} data Updated email template
   *
   * @apiError (Not Found 404)    NotFound     Email template does not exist
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only admins can modify the data
   */
  .post(
    getAuth("master.admin"),
    validate(validation.toggleEmailTemplateStatus),
    controller.toggleStatus
  );

router
  .route("/:id/preview")
  /**
   * @api {post} v1/email-templates/:id/preview Preview Email Template
   * @apiDescription Preview email template with variables
   * @apiVersion 1.0.0
   * @apiName PreviewEmailTemplate
   * @apiGroup EmailTemplate
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  User's access token
   *
   * @apiParam  {Object} [variables] Template variables for preview
   *
   * @apiSuccess {Object} data Preview data with formatted subject and body
   *
   * @apiError (Not Found 404)    NotFound     Email template does not exist
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only admins can access the data
   */
  .post(
    getAuth("master.admin"),
    validate(validation.previewEmailTemplate),
    controller.preview
  );

module.exports = router;
