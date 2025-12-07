const mongoose = require("mongoose");

const { Schema } = mongoose;

/**
 * SMS Template Schema
 * @private
 */
const SmsTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    template_id: {
      type: String,
      required: true,
      trim: true,
    },
    event_type: {
      type: String,
      enum: [
        "booking_confirmation",
        "booking_cancellation",
        "otp_verification",
        "payment_success",
        "custom",
      ],
      required: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

/**
 * SMS Notification Configuration Schema (MSG91)
 * @private
 */
const smsNotificationSchema = new Schema(
  {
    is_enabled: {
      type: Boolean,
      default: false,
    },
    auth_key: {
      type: String,
      required: true,
    },
    sender_id: {
      type: String,
      default: "",
    },
    templates: {
      type: [SmsTemplateSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Statics
 */
smsNotificationSchema.statics = {
  /**
   * Get SMS configuration
   */
  async getConfig() {
    let config = await this.findOne({});
    if (!config) {
      config = await this.create({
        is_enabled: false,
        auth_key: "",
      });
    }
    return config;
  },

  /**
   * Get template by event type
   */
  async getTemplateByEvent(eventType) {
    const config = await this.getConfig();
    return (
      config.templates.find((t) => t.event_type === eventType && t.is_active) ||
      null
    );
  },

  /**
   * Update statistics
   */
  async updateStats(success = true) {
    // Placeholder for future stats tracking
    return true;
  },
};

/**
 * @typedef SmsNotification
 */
module.exports = mongoose.model("SmsNotification", smsNotificationSchema);
