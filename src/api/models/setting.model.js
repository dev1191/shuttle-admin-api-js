const mongoose = require("mongoose");
const httpStatus = require("http-status");
// const mongoosePaginate = require('mongoose-paginate-v2');
// const moment = require('moment-timezone');

const { v4: uuidv4 } = require("uuid");
const { imageDelete, imageUpload } = require("../services/uploaderService");

const ReferralSchema = new mongoose.Schema(
  {
    user_type: { type: String, default: "customer" },
    value: { type: Number, default: 0 },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const SocialLinkSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g., "Facebook", "Twitter", "LinkedIn"
    url: { type: String, required: true }, // Social media URL
    order: { type: Number, default: 0 }, // Display order
    is_active: { type: Boolean, default: true }, // Show/hide link
  },
  { _id: false }
);

/**
 * setting Schema
 * @private
 */
const settingSchema = new mongoose.Schema(
  {
    general: {
      name: { type: String, index: true },
      tagline: { type: String, index: true },
      dark_logo: {
        type: String,
        default: "public/images/nologo.png",
        index: true,
      }, //public/images/nologo.png
      light_logo: {
        type: String,
        default: "public/images/nologo.png",
        index: true,
      }, //public/images/nologo.png
      favicon: {
        type: String,
        default: "public/images/nologo.png",
        index: true,
      }, //public/images/nologo.png
      email: { type: String, default: "", index: true },
      address: { type: String, default: "", index: true },
      phone: { type: String, default: "", index: true },
      google_key: { type: String, default: "", index: true },
      timezone: { type: String, default: "Asia/Kolkata" },
      date_format: { type: String, default: "DD MMM YYYY", index: true },
      time_format: { type: String, default: "hh:mm A", index: true },
      default_country: { type: String, index: true },
      default_currency: { type: String, index: true },
      default_language: { type: String, index: true },
      tax: { type: String, default: "0" },
      fee: { type: String, default: "0" },
      api_base_url: { type: String, default: "" },
      background_location_update_interval: { type: Number, default: 1000 },
      driver_online_location_update_interval: { type: Number, default: 1000 },
      max_distance: { type: Number, default: 2000 },
      prebooking_time: { type: Number, default: 30 },
      theme_mode: { type: String, default: "light" },
      primary_color: { type: String, default: "#18a058" },
      sidebar_style: { type: String, default: "dark" },
      app_url: { type: String, default: "" },
    },
    smtp: {
      is_production: { type: Boolean, default: false },
      username: { type: String, default: "", index: true },
      host: { type: String, default: "", index: true },
      port: { type: String, default: "", index: true },
      password: { type: String, default: "", index: true },
      encryption: { type: String, default: "tls", index: true },
      email: { type: String, default: "", index: true },
      name: { type: String, default: "", index: true },
      type: { type: String, default: "", index: true },
    },
    sms: {
      is_production: { type: Boolean, default: false },
      senderId: { type: String, default: "", index: true },
      username: { type: String, default: "", index: true },
      password: { type: String, default: "", index: true },
      apiKey: { type: String, default: "", index: true },
    },
    s3: {
      is_production: { type: Boolean, default: false },
      access_key: { type: String, default: "", index: true },
      secret_key: { type: String, default: "", index: true },
      region: { type: String, default: "", index: true },
      bucket: { type: String, default: "", index: true },
    },
    storage: {
      name: { type: String, default: "local" },
      spaces: {
        access_key: { type: String, default: "", index: true },
        secret_key: { type: String, default: "", index: true },
        region: { type: String, default: "", index: true },
        bucket: { type: String, default: "", index: true },
        endpoint: { type: String, default: "", index: true },
      },
      cloudinary: {
        cloud_name: { type: String, default: "" },
        api_key: { type: String, default: "" },
        api_secret: { type: String, default: "" },
      },
    },
    payments: {
      is_production: { type: Boolean, default: false },
      key: { type: String, default: "", index: true },
      secret: { type: String, default: "", index: true },
      text_name: { type: String, default: "", index: true },
      logo: { type: String, default: "", index: true }, //public/images/nologo.png
      theme_color: { type: String, default: "", index: true },
      currency: { type: String, default: "INR", index: true },
      name: { type: String, default: "", index: true },
      payment_capture: { type: String, default: "", index: true },
      email: { type: String, default: "", index: true },
      contact: { type: String, default: "", index: true },
    },
    notifications: {
      otp_validation_via: { type: Boolean, default: false },
      firebase_key: { type: String, default: "", index: true },
      firebase_database_url: { type: String, default: "", index: true },
      firebase_credential: { type: Object, default: "" },
      apple_key_id: { type: String, default: "", index: true },
      apple_team_id: { type: String, default: "", index: true },
      apple_key: { type: String, default: "", index: true },
    },
    terms: { type: String, index: true, default: "" },
    privacypolicy: { type: String, index: true, default: "" },
    refferal: { type: [ReferralSchema], index: true },
    referral_policy: { type: String, index: true },
    cancellation_policy: { type: String, index: true },
    refunds: {
      type: { type: String, default: "percentage" },
      amount: { type: Number, default: 0 },
      minimum_time: { type: Number, default: 0 },
      contents: { type: String, default: "" },
    },
    social_links: {
      type: [SocialLinkSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

settingSchema.statics = {
  async logoUpdate(settingId, image, FolderName, type) {
    const settingexists = await this.findById(settingId).exec();
    if (type == "general") {
      if (this.isValidBase64(settingexists.general.logo)) {
        await imageDelete(settingexists.general.logo, FolderName);
      }
      const logo = await imageUpload(image, `${uuidv4()}`, FolderName);
      return logo;
    }
    if (type == "payments") {
      if (this.isValidBase64(settingexists.payments.logo)) {
        await imageDelete(settingexists.payments.logo, FolderName);
        const logo = await imageUpload(image, `${uuidv4()}`, FolderName);
        return logo;
      }
      if (
        settingexists.payments.logo == "" ||
        settingexists.payments.logo == null
      ) {
        const logo = await imageUpload(image, `${uuidv4()}`, FolderName);
        return logo;
      }
    } else if (type == "notifications") {
      if (this.isValidBase64(settingexists.notifications.apple_key)) {
        await imageDelete(settingexists.notifications.apple_key, FolderName);
        return await fileUpload(image, `${uuidv4()}`, FolderName);
      }
    }
  },
  transFormSingleData(data, type) {
    if (type == "general") {
      return {
        id: data._id,
        name: data.general.name,
        logo: data.general.logo,
        email: data.general.email,
        address: data.general.address,
        phone: data.general.phone,
        google_key: data.general.google_key,
        timezone: data.general.timezone,
        date_format: data.general.date_format,
        time_format: data.general.time_format,
        default_country: data.general.default_country,
        default_currency: data.general.default_currency,
        tax: parseFloat(data.general.tax),
        fee: parseFloat(data.general.fee),
        api_base_url: data.general.api_base_url,
        background_location_update_interval:
          data.general.background_location_update_interval,
        driver_online_location_update_interval:
          data.general.driver_online_location_update_interval,
        max_distance: data.general.max_distance,
        prebooking_time: data.general.prebooking_time,
      };
    }
    if (type == "sms") {
      return {
        id: data._id,
        is_production: data.sms.is_production,
        senderId: data.sms.senderId,
        username: data.sms.username,
        password: data.sms.password,
        apiKey: data.sms.apiKey,
      };
    }
    if (type == "payments") {
      return {
        id: data._id,
        is_production: data.payments.is_production,
        key: data.payments.key,
        secret: data.payments.secret,
        logo: data.payments.logo,
        text_name: data.payments.text_name,
        theme_color: data.payments.theme_color,
        email: data.payments.email,
        name: data.payments.name,
        contact: data.payments.contact,
        currency: data.payments.currency,
        payment_capture: data.payments.payment_capture,
      };
    }
    if (type == "aws") {
      return {
        id: data._id,
        is_production: data.s3.is_production,
        access_key: data.s3.access_key,
        secret_key: data.s3.secret_key,
        region: data.s3.region,
        bucket: data.s3.bucket,
      };
    }
    if (type == "storage") {
      return {
        id: data._id,
        name: data.storage.name,
        spaces: {
          access_key: data.storage.spaces.access_key,
          secret_key: data.storage.spaces.secret_key,
          region: data.storage.spaces.region,
          bucket: data.storage.spaces.bucket,
          endpoint: data.storage.spaces.endpoint,
        },
        cloudinary: {
          cloud_name: data.storage.cloudinary.cloud_name,
          api_key: data.storage.cloudinary.api_key,
          api_secret: data.storage.cloudinary.api_secret,
        },
      };
    }
    if (type == "smtp") {
      return {
        id: data._id,
        is_production: data.smtp.is_production,
        type: data.smtp.type,
        username: data.smtp.username,
        host: data.smtp.host,
        port: data.smtp.port,
        encryption: data.smtp.encryption,
        password: data.smtp.password,
        name: data.smtp.name,
        email: data.smtp.email,
      };
    }
    if (type == "notifications") {
      return {
        id: data._id,
        otp_validation_via: data.notifications.otp_validation_via,
        firebase_key: data.notifications.firebase_key,
        firebase_database_url: data.notifications.firebase_database_url,
        apple_key_id: data.notifications.apple_key_id,
        apple_team_id: data.notifications.apple_team_id,
        apple_key: [],
        apple_key_name: data.notifications.apple_key,
      };
    }
    if (type == "terms") {
      return {
        id: data._id,
        terms: data.terms,
        type: "terms",
      };
    }
    if (type == "privacypolicy") {
      return {
        id: data._id,
        privacypolicy: data.privacypolicy,
        type: "privacypolicy",
      };
    }
    if (type == "refunds") {
      return {
        id: data._id,
        type: data.refunds.type,
        amount: data.refunds.amount,
        minimum_time: data.refunds.minimum_time,
        contents: data.refunds.contents,
      };
    }
    if (type == "referral") {
      return {
        id: data._id,
        referral: data.refferal,
      };
    }
    if (type == "referral_policy") {
      return {
        id: data._id,
        referral_policy: data.referral_policy,
        type: "referral_policy",
      };
    }
    if (type == "social_links") {
      return {
        id: data._id,
        social_links: data.social_links
          .filter((link) => link.is_active)
          .sort((a, b) => a.order - b.order),
      };
    }
  },
  async getrefunds() {
    const getrefunds = await this.findOne({}, "refunds").lean();
    return getrefunds;
  },
  async findNotifySettings() {
    const getsetting = await this.findOne({}, "notifications").limit(1).lean();
    return getsetting;
  },
  async getgeneral() {
    const getgeneral = await this.findOne({}, "general notifications").lean();
    return getgeneral.general;
  },
  async gets3() {
    const gets3 = await this.findOne({}, "s3").lean();
    return gets3.s3;
  },
  async getStorage() {
    const getStorage = await this.findOne({}, "storage").lean();
    return getStorage.storage;
  },
  isValidURL(str) {
    const regex =
      /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
      return false;
    }
    return true;
  },
  isValidBase64(str) {
    const regex =
      /^data:image\/(?:gif|png|jpeg|jpg|bmp|webp)(?:;charset=utf-8)?;base64,(?:[A-Za-z0-9]|[+/])+={0,2}/g;

    if (regex.test(str)) {
      return true;
    }
    return false;
  },
};

module.exports = mongoose.model("Setting", settingSchema);
