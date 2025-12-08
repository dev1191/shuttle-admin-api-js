const Joi = require("joi");

module.exports = {
  // GET /v1/email-templates
  listEmailTemplates: {
    query: Joi.object({
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      search: Joi.string().allow(""),
      sortBy: Joi.string().allow(""),
      sortDesc: Joi.string().allow(""),
      recipient_type: Joi.string().valid(
        "admin",
        "operator",
        "driver",
        "customer"
      ),
      event_type: Joi.string().valid(
        "booking_confirmation",
        "booking_cancellation",
        "payment_success",
        "payment_failed",
        "refund_processed",
        "password_reset",
        "welcome",
        "otp_verification",
        "trip_assigned",
        "trip_started",
        "trip_completed",
        "custom"
      ),
      is_active: Joi.boolean(),
    }),
  },

  // POST /v1/email-templates
  createEmailTemplate: {
    body: Joi.object({
      name: Joi.string().required().trim(),
      slug: Joi.string().required().trim().lowercase(),
      subject: Joi.string().required().trim(),
      body: Joi.string().required(),
      recipient_type: Joi.string()
        .required()
        .valid("admin", "operator", "driver", "customer"),
      event_type: Joi.string()
        .required()
        .valid(
          "booking_confirmation",
          "booking_cancellation",
          "payment_success",
          "payment_failed",
          "refund_processed",
          "password_reset",
          "welcome",
          "otp_verification",
          "trip_assigned",
          "trip_started",
          "trip_completed",
          "custom"
        ),
      variables: Joi.array().items(Joi.string()),
      is_active: Joi.boolean(),
      description: Joi.string().allow(""),
    }),
  },

  // PATCH /v1/email-templates/:id
  updateEmailTemplate: {
    params: Joi.object({
      id: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
    body: Joi.object({
      name: Joi.string().trim(),
      slug: Joi.string().trim().lowercase(),
      subject: Joi.string().trim(),
      body: Joi.string(),
      recipient_type: Joi.string().valid(
        "admin",
        "operator",
        "driver",
        "customer"
      ),
      event_type: Joi.string().valid(
        "booking_confirmation",
        "booking_cancellation",
        "payment_success",
        "payment_failed",
        "refund_processed",
        "password_reset",
        "welcome",
        "otp_verification",
        "trip_assigned",
        "trip_started",
        "trip_completed",
        "custom"
      ),
      variables: Joi.array().items(Joi.string()),
      is_active: Joi.boolean(),
      description: Joi.string().allow(""),
    }),
  },

  // GET /v1/email-templates/:id
  getEmailTemplate: {
    params: Joi.object({
      id: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
  },

  // GET /v1/email-templates/slug/:slug
  getEmailTemplateBySlug: {
    params: Joi.object({
      slug: Joi.string().required(),
    }),
  },

  // DELETE /v1/email-templates/:id
  deleteEmailTemplate: {
    params: Joi.object({
      id: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
  },

  // POST /v1/email-templates/:id/toggle-status
  toggleEmailTemplateStatus: {
    params: Joi.object({
      id: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
  },

  // POST /v1/email-templates/:id/preview
  previewEmailTemplate: {
    params: Joi.object({
      id: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
    body: Joi.object({
      variables: Joi.object().pattern(Joi.string(), Joi.any()),
    }),
  },
};
