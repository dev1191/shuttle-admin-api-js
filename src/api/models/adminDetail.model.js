const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { Schema } = mongoose;
const { ObjectId } = Schema;

/**
 * Admin Schema
 * @private
 */
const admindetailSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    address_1: { type: String, default: "" },
    address_2: { type: String, default: "" },
    city: { type: [Object], default: [{}] },
    pincode: { type: String, default: "" },
    contact_no: { type: String, default: "" },
    // Operator-specific fields
    is_operator: { type: Boolean, default: true },
    operator_business_name: { type: String, default: "" },
    operator_license_number: { type: String, default: "" },
    operator_commission: { type: Number, default: 0 }, // Platform commission percentage
    operator_status: {
      type: String,
      enum: ["pending", "active", "suspended", "rejected"],
      default: "pending",
    },
    operator_approved_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    operator_approved_at: { type: Date, default: null },
    operator_rejection_reason: { type: String, default: "" },
    // Additional operator documents
    operator_transport_license: {
      type: String,
      default: "public/documents/default.jpg",
    },
    operator_business_registration: {
      type: String,
      default: "public/documents/default.jpg",
    },
    operator_pan_card: {
      type: String,
      default: "public/documents/default.jpg",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Methods
 */
admindetailSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "adminId",
      "address_1",
      "address_2",
      "city",
      "pincode",
      "is_operator",
      "operator_business_name",
      "operator_license_number",
      "operator_commission_percentage",
      "operator_status",
      "operator_approved_by",
      "operator_approved_at",
      "operator_rejection_reason",
      "operator_transport_license",
      "operator_business_registration",
      "createdAt",
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
admindetailSchema.statics = {};
/**
 * @typedef Admin Detail
 */
module.exports = mongoose.model("Admin_Detail", admindetailSchema);
