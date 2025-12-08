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
      limit = 10,
      search = "",
      event_type = "",
      recipient_type = "",
      is_active,
      sortBy = "createdAt",
      sortDesc = "desc",
    } = req.query;

    // Build query condition
    const condition = {};

    if (search) {
      condition.$or = [
        { name: { $regex: new RegExp(search), $options: "i" } },
        { slug: { $regex: new RegExp(search), $options: "i" } },
        { subject: { $regex: new RegExp(search), $options: "i" } },
      ];
    }

    if (event_type) {
      condition.event_type = event_type;
    }

    if (recipient_type) {
      condition.recipient_type = recipient_type;
    }

    if (is_active !== undefined && is_active !== "") {
      condition.is_active = is_active === "true" || is_active === true;
    }

    // Build sort object
    let sort = {};
    if (sortBy && sortDesc) {
      sort = { [sortBy]: sortDesc === "desc" ? -1 : 1 };
    }

    // Pagination options
    const paginationOptions = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
      lean: true,
    };

    const result = await EmailTemplate.paginate(condition, paginationOptions);
    res.json(result);
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
    const emailService = require("../services/emailService");
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        message: "Email template not found",
      });
    }

    const variables = req.body.variables || {};
    const rendered = await emailService.previewEmail(
      template.subject,
      template.body,
      variables
    );

    res.json({
      code: httpStatus.OK,
      message: "Email template preview generated successfully",
      data: {
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        original_subject: template.subject,
        original_body: template.body,
        variables_used: template.variables,
      },
    });
  } catch (error) {
    next(error);
  }
};
