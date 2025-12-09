const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");
const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const moment = require("moment-timezone");

const { Schema } = mongoose;
const { ObjectId } = Schema;

/**
 * Operator Earnings Schema
 * @private
 */
const operatorEarningsSchema = new Schema(
  {
    operatorId: {
      type: ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    bookingId: {
      type: ObjectId,
      ref: "Booking",
      required: true,
      index: true,
    },
    booking_amount: {
      type: Number,
      required: true,
      default: 0,
    },
    platform_commission_percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    platform_commission: {
      type: Number,
      required: true,
      default: 0,
    },
    operator_earnings: {
      type: Number,
      required: true,
      default: 0,
    },
    payout_status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    payout_date: {
      type: Date,
      default: null,
    },
    payout_reference: {
      type: String,
      default: "",
    },
    payout_method: {
      type: String,
      enum: ["bank_transfer", "upi", "wallet", "cheque", "other"],
      default: "bank_transfer",
    },
    notes: {
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
operatorEarningsSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "operatorId",
      "bookingId",
      "booking_amount",
      "platform_commission_percentage",
      "platform_commission",
      "operator_earnings",
      "payout_status",
      "payout_date",
      "payout_reference",
      "payout_method",
      "notes",
      "createdAt",
      "updatedAt",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

/**
 * Statics
 */
operatorEarningsSchema.statics = {
  /**
   * Get total earnings for an operator
   * @param {ObjectId} operatorId - The operator ID
   * @param {String} status - Optional payout status filter
   * @returns {Promise<Number>}
   */
  async getTotalEarnings(operatorId, status = null) {
    const query = { operatorId };
    if (status) {
      query.payout_status = status;
    }

    const result = await this.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: "$operator_earnings" },
        },
      },
    ]);

    return result.length > 0 ? result[0].total : 0;
  },

  /**
   * Get earnings summary for an operator
   * @param {ObjectId} operatorId - The operator ID
   * @returns {Promise<Object>}
   */
  async getEarningsSummary(operatorId) {
    const [pending, processing, completed, failed] = await Promise.all([
      this.getTotalEarnings(operatorId, "pending"),
      this.getTotalEarnings(operatorId, "processing"),
      this.getTotalEarnings(operatorId, "completed"),
      this.getTotalEarnings(operatorId, "failed"),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      total: pending + processing + completed + failed,
      available_for_payout: pending,
    };
  },

  /**
   * Transform earnings data for display
   * @param {Array} rows - Array of earnings documents
   * @returns {Array}
   */
  transformData(rows) {
    const selectableItems = [];
    let i = 1;

    rows.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item._id,
        operator_name: item.operatorId
          ? `${item.operatorId.firstname} ${item.operatorId.lastname}`
          : "",
        booking_pnr: item.bookingId ? item.bookingId.pnr_no : "",
        booking_amount: parseFloat(item.booking_amount).toFixed(2),
        platform_commission_percentage: item.platform_commission_percentage,
        platform_commission: parseFloat(item.platform_commission).toFixed(2),
        operator_earnings: parseFloat(item.operator_earnings).toFixed(2),
        payout_status: item.payout_status,
        payout_date: item.payout_date
          ? moment(item.payout_date)
              .tz(DEFAULT_TIMEZONE)
              .format(DEFAULT_DATEFORMAT)
          : "-",
        payout_reference: item.payout_reference || "-",
        payout_method: item.payout_method,
        createdAt: moment(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format(DEFAULT_DATEFORMAT),
      });
    });

    return selectableItems;
  },

  /**
   * Calculate earnings from booking amount
   * @param {Number} bookingAmount - Total booking amount
   * @param {Number} commissionPercentage - Platform commission percentage
   * @returns {Object}
   */
  calculateEarnings(bookingAmount, commissionPercentage) {
    const platformCommission = (bookingAmount * commissionPercentage) / 100;
    const operatorEarnings = bookingAmount - platformCommission;

    return {
      booking_amount: bookingAmount,
      platform_commission_percentage: commissionPercentage,
      platform_commission: parseFloat(platformCommission.toFixed(2)),
      operator_earnings: parseFloat(operatorEarnings.toFixed(2)),
    };
  },
};

// Add indexes for better query performance
operatorEarningsSchema.index({ operatorId: 1, payout_status: 1 });
operatorEarningsSchema.index({ operatorId: 1, createdAt: -1 });
operatorEarningsSchema.index({ bookingId: 1 });

operatorEarningsSchema.plugin(mongoosePaginate);
operatorEarningsSchema.plugin(paginateAggregate);

/**
 * @typedef OperatorEarnings
 */
module.exports = mongoose.model("Operator_Earnings", operatorEarningsSchema);
