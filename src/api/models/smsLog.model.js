const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const moment = require("moment-timezone");

const { Schema } = mongoose;
const { ObjectId } = Schema;

/**
 * SMS Log Schema
 * @private
 */
const smsLogSchema = new Schema(
  {
    userId: {
      type: ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    driverId: {
      type: ObjectId,
      ref: "Driver",
      default: null,
      index: true,
    },
    bookingId: {
      type: ObjectId,
      ref: "Booking",
      default: null,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
    },
    country_code: {
      type: String,
      default: "91",
    },
    message: {
      type: String,
      required: true,
    },
    template_id: {
      type: String,
      default: "",
      index: true,
    },
    event_type: {
      type: String,
      enum: [
        "booking_confirmation",
        "booking_cancellation",
        "booking_reminder",
        "payment_success",
        "payment_failed",
        "refund_processed",
        "otp_verification",
        "driver_assigned",
        "trip_started",
        "trip_completed",
        "custom",
      ],
      default: "custom",
      index: true,
    },
    provider: {
      type: String,
      enum: ["msg91", "twilio", "aws_sns", "other"],
      default: "msg91",
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "delivered", "failed", "rejected"],
      default: "pending",
      index: true,
    },
    // Provider Response
    provider_response: {
      message_id: { type: String, default: "" },
      request_id: { type: String, default: "" },
      response_code: { type: String, default: "" },
      response_message: { type: String, default: "" },
      raw_response: { type: Object, default: {} },
    },
    // Error Details
    error: {
      code: { type: String, default: "" },
      message: { type: String, default: "" },
      details: { type: Object, default: {} },
    },
    // Delivery Status
    delivery_status: {
      delivered_at: { type: Date, default: null },
      failed_at: { type: Date, default: null },
      status_updated_at: { type: Date, default: null },
    },
    // Metadata
    metadata: {
      type: Object,
      default: {},
    },
    // Retry Information
    retry_count: {
      type: Number,
      default: 0,
    },
    max_retries: {
      type: Number,
      default: 3,
    },
    next_retry_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Indexes
 */
smsLogSchema.index({ createdAt: -1 });
smsLogSchema.index({ status: 1, createdAt: -1 });
smsLogSchema.index({ event_type: 1, createdAt: -1 });
smsLogSchema.index({ phone: 1, createdAt: -1 });

/**
 * Methods
 */
smsLogSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "userId",
      "driverId",
      "bookingId",
      "phone",
      "country_code",
      "message",
      "template_id",
      "event_type",
      "provider",
      "status",
      "provider_response",
      "error",
      "delivery_status",
      "metadata",
      "retry_count",
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
smsLogSchema.statics = {
  /**
   * Create SMS log entry
   */
  async logSms(data) {
    try {
      const smsLog = await this.create({
        userId: data.userId || null,
        driverId: data.driverId || null,
        bookingId: data.bookingId || null,
        phone: data.phone,
        country_code: data.country_code || "91",
        message: data.message,
        template_id: data.template_id || "",
        event_type: data.event_type || "custom",
        provider: data.provider || "msg91",
        status: data.status || "pending",
        metadata: data.metadata || {},
      });
      return smsLog;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update SMS status
   */
  async updateStatus(smsLogId, status, providerResponse = {}) {
    try {
      const updateData = {
        status,
        "provider_response.message_id": providerResponse.message_id || "",
        "provider_response.request_id": providerResponse.request_id || "",
        "provider_response.response_code": providerResponse.response_code || "",
        "provider_response.response_message":
          providerResponse.response_message || "",
        "provider_response.raw_response": providerResponse.raw_response || {},
      };

      if (status === "delivered") {
        updateData["delivery_status.delivered_at"] = new Date();
        updateData["delivery_status.status_updated_at"] = new Date();
      } else if (status === "failed") {
        updateData["delivery_status.failed_at"] = new Date();
        updateData["delivery_status.status_updated_at"] = new Date();
      }

      const smsLog = await this.findByIdAndUpdate(smsLogId, updateData, {
        new: true,
      });
      return smsLog;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Update error details
   */
  async updateError(smsLogId, errorData) {
    try {
      const smsLog = await this.findByIdAndUpdate(
        smsLogId,
        {
          status: "failed",
          "error.code": errorData.code || "",
          "error.message": errorData.message || "",
          "error.details": errorData.details || {},
          "delivery_status.failed_at": new Date(),
          "delivery_status.status_updated_at": new Date(),
        },
        { new: true }
      );
      return smsLog;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get SMS logs with filters
   */
  async getLogs(filters = {}, options = {}) {
    try {
      const query = {};

      if (filters.userId) query.userId = filters.userId;
      if (filters.driverId) query.driverId = filters.driverId;
      if (filters.bookingId) query.bookingId = filters.bookingId;
      if (filters.phone) query.phone = filters.phone;
      if (filters.event_type) query.event_type = filters.event_type;
      if (filters.status) query.status = filters.status;
      if (filters.provider) query.provider = filters.provider;

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate)
          query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const page = options.page || 1;
      const limit = options.limit || 20;
      const sort = options.sort || { createdAt: -1 };

      const result = await this.paginate(query, {
        page,
        limit,
        sort,
        populate: [
          { path: "userId", select: "firstname lastname phone email" },
          { path: "driverId", select: "firstname lastname phone" },
          { path: "bookingId", select: "pnr_no travel_status" },
        ],
      });

      return result;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get statistics
   */
  async getStats(filters = {}) {
    try {
      const query = {};

      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate)
          query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }

      const [total, sent, delivered, failed, pending] = await Promise.all([
        this.countDocuments(query),
        this.countDocuments({ ...query, status: "sent" }),
        this.countDocuments({ ...query, status: "delivered" }),
        this.countDocuments({ ...query, status: "failed" }),
        this.countDocuments({ ...query, status: "pending" }),
      ]);

      const successRate =
        total > 0 ? ((delivered / total) * 100).toFixed(2) : 0;
      const failureRate = total > 0 ? ((failed / total) * 100).toFixed(2) : 0;

      return {
        total,
        sent,
        delivered,
        failed,
        pending,
        success_rate: successRate,
        failure_rate: failureRate,
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get pending retries
   */
  async getPendingRetries() {
    try {
      const now = new Date();
      const logs = await this.find({
        status: "failed",
        retry_count: {
          $lt: mongoose.model("SmsLog").schema.path("max_retries").default,
        },
        $or: [{ next_retry_at: { $lte: now } }, { next_retry_at: null }],
      }).limit(50);

      return logs;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Increment retry count
   */
  async incrementRetry(smsLogId) {
    try {
      const smsLog = await this.findById(smsLogId);
      if (!smsLog) return null;

      smsLog.retry_count += 1;
      // Exponential backoff: 5min, 15min, 45min
      const backoffMinutes = Math.pow(3, smsLog.retry_count) * 5;
      smsLog.next_retry_at = new Date(Date.now() + backoffMinutes * 60 * 1000);
      smsLog.status = "pending";

      await smsLog.save();
      return smsLog;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Transform data for display
   */
  transformData(data) {
    const selectableItems = [];
    let i = 1;

    data.forEach((item) => {
      const recipientName = item.userId
        ? `${item.userId.firstname} ${item.userId.lastname}`
        : item.driverId
        ? `${item.driverId.firstname} ${item.driverId.lastname}`
        : "N/A";

      selectableItems.push({
        id: i++,
        ids: item._id,
        recipient: `${recipientName}<br/><small>${item.country_code}${item.phone}</small>`,
        phone: `${item.country_code}${item.phone}`,
        message:
          item.message.length > 50
            ? item.message.substring(0, 50) + "..."
            : item.message,
        full_message: item.message,
        event_type: item.event_type,
        status: item.status,
        provider: item.provider,
        template_id: item.template_id || "-",
        booking_pnr: item.bookingId ? item.bookingId.pnr_no : "-",
        retry_count: item.retry_count,
        created_at: moment(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(`${DEFAULT_DATEFORMAT} ${DEFAULT_TIMEFORMAT}`),
        delivered_at: item.delivery_status.delivered_at
          ? moment(item.delivery_status.delivered_at)
              .tz(DEFAULT_TIMEZONE)
              .format(`${DEFAULT_DATEFORMAT} ${DEFAULT_TIMEFORMAT}`)
          : "-",
      });
    });

    return selectableItems;
  },
};

smsLogSchema.plugin(mongoosePaginate);

/**
 * @typedef SmsLog
 */
module.exports = mongoose.model("SmsLog", smsLogSchema);
