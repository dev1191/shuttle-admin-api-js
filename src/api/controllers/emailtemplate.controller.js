const EmailTemplate = require("../models/emailTemplate.model");
const httpStatus = require("http-status");

/**
 * Get all email templates
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const {
      page = 1,
      perPage = 20,
      search = "",
      event_type = "",
      recipient_type = "",
      is_active,
    } = req.query;

    const templates = await EmailTemplate.list({
      page: parseInt(page),
      perPage: parseInt(perPage),
      search,
      event_type,
      recipient_type,
      is_active: is_active !== undefined ? is_active === "true" : null,
    });

    res.json({
      code: httpStatus.OK,
      message: "Email templates retrieved successfully",
      data: templates.docs,
      pagination: {
        total: templates.totalDocs,
        page: templates.page,
        pages: templates.totalPages,
        perPage: templates.limit,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get email template by ID
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    res.json({
      code: httpStatus.OK,
      message: "Email template retrieved successfully",
      data: template.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get email template by slug
 * @public
 */
exports.getBySlug = async (req, res, next) => {
  try {
    const template = await EmailTemplate.getBySlug(req.params.slug);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    res.json({
      code: httpStatus.OK,
      message: "Email template retrieved successfully",
      data: template.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new email template
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      subject,
      body,
      recipient_type,
      event_type,
      variables,
      is_active,
      description,
    } = req.body;

    // Check if slug already exists
    const existingTemplate = await EmailTemplate.findOne({ slug });
    if (existingTemplate) {
      return res.status(httpStatus.CONFLICT).json({
        code: httpStatus.CONFLICT,
        message: "Email template with this slug already exists",
      });
    }

    const template = await EmailTemplate.create({
      name,
      slug,
      subject,
      body,
      recipient_type,
      event_type,
      variables: variables || [],
      is_active: is_active !== undefined ? is_active : true,
      description: description || "",
    });

    res.status(httpStatus.CREATED).json({
      code: httpStatus.CREATED,
      message: "Email template created successfully",
      data: template.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update email template
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const {
      name,
      slug,
      subject,
      body,
      recipient_type,
      event_type,
      variables,
      is_active,
      description,
    } = req.body;

    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== template.slug) {
      const existingTemplate = await EmailTemplate.findOne({ slug });
      if (existingTemplate) {
        return res.status(httpStatus.CONFLICT).json({
          code: httpStatus.CONFLICT,
          message: "Email template with this slug already exists",
        });
      }
    }

    // Update fields
    if (name) template.name = name;
    if (slug) template.slug = slug;
    if (subject) template.subject = subject;
    if (body) template.body = body;
    if (recipient_type) template.recipient_type = recipient_type;
    if (event_type) template.event_type = event_type;
    if (variables) template.variables = variables;
    if (is_active !== undefined) template.is_active = is_active;
    if (description !== undefined) template.description = description;

    await template.save();

    res.json({
      code: httpStatus.OK,
      message: "Email template updated successfully",
      data: template.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete email template
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    await template.deleteOne();

    res.json({
      code: httpStatus.OK,
      message: "Email template deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle email template status
 * @public
 */
exports.toggleStatus = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    template.is_active = !template.is_active;
    await template.save();

    res.json({
      code: httpStatus.OK,
      message: `Email template ${
        template.is_active ? "activated" : "deactivated"
      } successfully`,
      data: template.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Preview email template with variables
 * @public
 */
exports.preview = async (req, res, next) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    const variables = req.body.variables || {};
    const formatted = EmailTemplate.formatTemplate(template, variables);

    res.json({
      code: httpStatus.OK,
      message: "Email template preview generated successfully",
      data: {
        subject: formatted.subject,
        body: formatted.body,
        original_subject: template.subject,
        original_body: template.body,
        variables_used: template.variables,
      },
    });
  } catch (error) {
    next(error);
  }
};
