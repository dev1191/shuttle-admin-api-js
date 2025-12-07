const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const { Schema } = mongoose;

/**
 * Email Template Schema
 * @private
 */
const emailTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    recipient_type: {
      type: String,
      enum: ["admin", "operator", "driver", "customer"],
      required: true,
      index: true,
    },
    event_type: {
      type: String,
      enum: [
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
        "custom",
      ],
      required: true,
      index: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Methods
 */
emailTemplateSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "name",
      "slug",
      "subject",
      "body",
      "recipient_type",
      "event_type",
      "variables",
      "is_active",
      "description",
      "createdAt",
      "updatedAt",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    transformed.id = this._id;
    return transformed;
  },
});

/**
 * Statics
 */
emailTemplateSchema.statics = {
  /**
   * Get template by slug
   */
  async getBySlug(slug) {
    try {
      const template = await this.findOne({ slug, is_active: true });
      return template;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get template by event type
   */
  async getByEventType(eventType) {
    try {
      const template = await this.findOne({
        event_type: eventType,
        is_active: true,
      });
      return template;
    } catch (error) {
      throw error;
    }
  },

  /**
   * List templates with pagination
   */
  async list({
    page = 1,
    perPage = 20,
    search = "",
    event_type = "",
    recipient_type = "",
    is_active = null,
  }) {
    try {
      const query = {};

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { slug: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
        ];
      }

      if (event_type) {
        query.event_type = event_type;
      }

      if (recipient_type) {
        query.recipient_type = recipient_type;
      }

      if (is_active !== null) {
        query.is_active = is_active;
      }

      const options = {
        page,
        limit: perPage,
        sort: { createdAt: -1 },
      };

      const result = await this.paginate(query, options);
      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Format template with variables
   */
  formatTemplate(template, variables) {
    let subject = template.subject;
    let body = template.body;

    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return { subject, body };
  },

  /**
   * Transform data for list view
   */
  transformData(data) {
    const selectableItems = [];
    let i = 1;

    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item._id,
        name: item.name,
        slug: item.slug,
        subject: item.subject,
        event_type: item.event_type,
        variables: item.variables.join(", "),
        is_active: item.is_active ? "Active" : "Inactive",
        created_at: item.createdAt,
      });
    });

    return selectableItems;
  },
};

emailTemplateSchema.plugin(mongoosePaginate);

/**
 * @typedef EmailTemplate
 */
module.exports = mongoose.model("EmailTemplate", emailTemplateSchema);
