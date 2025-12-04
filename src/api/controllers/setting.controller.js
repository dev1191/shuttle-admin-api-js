const httpStatus = require("http-status");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const fs = require("fs");
const Setting = require("../models/setting.model");
const s3 = require("../../config/s3");
const {
  fileUpload,
  imageDelete,
  uploadLocal,
} = require("../services/uploaderService");
const { getFirstLetters } = require("../helpers/validate");

exports.terms = async (req, res) => {
  try {
    const settings = await Setting.findOne({}, "terms").sort({ _id: -1 });
    res.status(httpStatus.OK);
    res.json({
      status: true,
      data: settings.terms,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

exports.privacy = async (req, res) => {
  try {
    const settings = await Setting.findOne({}, "privacypolicy").sort({
      _id: -1,
    });
    res.status(httpStatus.OK);
    res.json({
      status: true,
      data: settings.privacypolicy,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get application settings
 * @public
 */
exports.fetch = async (req, res) => {
  try {
    const settings = await Setting.findOne({}).sort({ _id: -1 });
    res.status(httpStatus.OK);
    res.json({
      appName: settings.general.name,
      appShortName: getFirstLetters(settings.general.name),
      appLogo: settings.general.logo,
      appEmail: settings.general.email,
      appAddress: settings.general.address,
      appPhone: settings.general.phone,
      defaultCountry: settings.general.default_country,
      defaultCurrency: settings.general.default_currency,
      timezone: settings.general.timezone,
      googleKey: settings.general.google_key,
      dateFormat: settings.general.date_format,
      timeFormat: settings.general.time_format,
      maxDistance: settings.general.max_distance,
      prebookingTime: settings.general.prebooking_time,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get application settings
 * @public
 */
exports.get = async (req, res) => {
  try {
    const settings = await Setting.findOne({}).sort({ _id: -1 }).limit(1);
    res.status(httpStatus.OK);
    res.json({
      message: "setting fetched successfully.",
      data: Setting.transFormSingleData(settings, req.params.type),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new application settings
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { type, general, sms, email, terms, payment, s3 } = req.body;

    if (type == "general") {
      const settingObject = {
        general: {
          name: general.name,
          logo: general.logo,
          email: general.email,
          address: general.address,
          phone: general.phone,
          timezone: general.timezone.tzCode,
          google_key: general.googlekey,
          tax: general.tax,
          fee: general.fee,
        },
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        data: setting,
        status: true,
      });
    } else if (type == "s3") {
      const settingObject = {
        is_production: s3.is_production,
        access_key: s3.access_key,
        secret_key: s3.secret_key,
        region: s3.region,
        bucket: s3.bucket,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting,
        status: true,
      });
    } else if (type == "email") {
      const settingObject = {
        is_production: email.is_production,
        type: email.type,
        username: email.username,
        host: email.host,
        password: email.password,
        port: email.port,
        encryption: email.encryption,
        email: email.email,
        name: email.name,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.email,
        status: true,
      });
    } else if (type == "sms") {
      const settingObject = {
        is_production: sms.is_production,
        senderId: sms.senderId,
        username: email.username,
        password: email.password,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.sms,
        status: true,
      });
    } else if (type == "terms") {
      const settingObject = {
        terms,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.terms,
        status: true,
      });
    } else if (type == "refunds") {
      const settingObject = {
        refunds,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "refunds created successfully.",
        location: setting.terms,
        status: true,
      });
    } else if (type == "payment") {
      const settingObject = {
        is_production: payment.is_production,
        key: payment.key,
        secret: payment.secret,
        text_name: payment.text_name,
        payment_capture: payment.payment_capture,
        logo: payment.logo,
        contact: payment.contact,
        email: payment.email,
        theme_color: payment.theme_color,
        currency: payment.currency,
        name: payment.name,
      };
      const setting = await new Setting(settingObject).save();
      res.status(httpStatus.CREATED);
      res.json({
        message: "general created successfully.",
        location: setting.terms,
        status: true,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing Setting
 * @public
 */
exports.updateNotificationSetting = async (req, res, next) => {
  try {
    const {
      type,
      apple_key_id,
      apple_team_id,
      firebase_database_url,
      otp_validation_via,
    } = req.body;

    const settingObject = {
      notifications: {
        otp_validation_via,
        firebase_database_url,
        apple_key_id,
        apple_team_id,
      },
    };
    const FolderName = process.env.S3_BUCKET_SETTINGS;
    const settingexists = await Setting.findById(req.params.settingId).exec();
    let appleFile = req.files.apple_key;
    if (appleFile) {
      let uploadApplePath = path.join(
        __dirname,
        "../../api/services/files",
        appleFile.name
      );

      if (settingexists && settingexists.apple_key != "") {
        // await imageDelete(settingexists.notifications.apple_key, FolderName);
        await appleFile.mv(uploadApplePath);
        settingObject.notifications.apple_key = appleFile.name;
      } else {
        /** settingObject.notifications.apple_key = await fileUpload(
				req.files.apple_key,
				uuidv4(),
				FolderName
			  ); **/
        await appleFile.mv(uploadApplePath);
        settingObject.notifications.apple_key = appleFile.name;
      }
    }

    let firebaseFile = req.files.firebase_key;
    if (firebaseFile) {
        const firebaseRawdata = firebaseFile.data.toString('utf-8');

       // Parse the JSON
       settingObject.notifications.firebase_credential = JSON.parse(firebaseRawdata);
    }
   

    await Setting.findByIdAndUpdate(
      req.params.settingId,
      {
        $set: settingObject,
      },
      {
        new: true,
      }
    );
    res.json({
      message: "notifications updated successfully.",
      status: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/**
 * Update existing Setting
 * @public
 */
exports.update = async (req, res, next) => {
   try {
    const { type } = req.params; // e.g. 'general' or 'smtp'
    const data = req.body; // object containing updated fields

    //const existingAdmin = await Setting.findOne({}, { [type]: 1 }).lean();

    console.log("data",data)
    const updated = await Setting.findOneAndUpdate(
      {}, // update the first (and usually only) settings document
      { [type]: data }, // dynamically set the field (e.g. { general: {...} })
      { new: true, upsert: true } // return updated doc and create if not exists
    );

    res.status(200).json({
      msg: `${type} setting updated successfully.`,
      data: updated[type],
      code: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Something went wrong.",
      code: 500,
    });
  }
};
