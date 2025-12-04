const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");
const Role = require("../models/role.model");
const AdminDetail = require("../models/adminDetail.model");
const slug = require("slug");
const { v4: uuidv4 } = require("uuid");
const Listeners = require("../events/Listener");
const APIError = require("../utils/APIError");
const emailProvider = require("../services/emails/emailProvider");
const {
  imageDelete,
  imageUpload,
  resizeUpload,
  uploadLocal,
  deleteLocal,
} = require("../services/uploaderService");
const { handleImageUpload } = require("../utils/imageHandler");

exports.lists = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $and: [
            {
              $or: [
                {
                  fullname: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  lastname: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  email: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  phone: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  role: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
              ],
            },
            { role: { $ne: "operator" } },
          ],
        }
      : { role: { $ne: "operator" } };

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    let newquery = {};
    if (req.query.createdAt) {
      const date = new Date(req.query.createdAt[0]);
      const nextDate = new Date(req.query.createdAt[1]);
      newquery.createdAt = {
        $gte: date,
        $lt: nextDate,
      };
    } else if (req.query.status) {
      newquery.is_active = req.query.status;
    } else if (typeof req.query.status === 'boolean' && !req.query.status) {
      newquery.is_active = req.query.status;
    } 

    console.log("newquery", newquery);
    condition = { ...condition, ...newquery };

    const aggregateQuery = Admin.aggregate([
      {
        $lookup: {
          from: "admin_details",
          localField: "adminId",
          foreignField: "_id",
          as: "admin_detail",
        },
      },
      {
        $unwind: {
          path: "$admin_detail",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          id: {
            $toString: {
              $add: [{ $indexOfArray: [[], "$_id"] }, 1],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          id: 1,
          picture: 1,
          firstname: 1,
          lastname: 1,
          fullname: { $concat: ["$firstname", " ", "$lastname"] },
          short_name: {
            $toUpper: {
              $concat: [
                { $substr: ["$firstname", 0, 1] },
                { $substr: ["$lastname", 0, 1] },
              ],
            },
          },
          email: 1,
          phone: 1,
          country_code: 1,
          role: 1,
          last_login: 1,
          is_active: 1,
          createdAt: 1,
        },
      },
      {
        $addFields: {
          sequence: { $add: [{ $indexOfArray: ["$_id", "$_id"] }, 1] },
        },
      },
      {
        $match: condition,
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
    };

    const result = await Admin.aggregatePaginate(aggregateQuery, options);

    res.json(result);
  } catch (error) {
    console.log("error111", error);
    next(error);
  }
};

/**
 * Create new admin
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      role,
      phone,
      contact_no,
      is_active,
      country_code,
    } = req.body;
    const FolderName =
      role == "operator"
        ? process.env.S3_BUCKET_AGENTDOC
        : process.env.S3_BUCKET_USERPRO;
    const objadmin = {
      firstname,
      lastname,
      email,
      phone,
      password: phone,
      is_active,
      role,
    };

    const isProductionS3 = await Setting.gets3();

    //  console.log("picture", picture);
    if (picture && (await Admin.isValidBase64(picture))) {
      if (isProductionS3.is_production) {
        // upload data to aws s3,
        const base64 = picture.replace(/^data:image\/\w+;base64,/, "");
        const buffer = await resizeUpload(true, base64, 40, 40);
        objadmin.picture = await imageUpload(
          buffer,
          `profile-${uuidv4()}`,
          FolderName
        );
      } else {
        objadmin.picture = await uploadLocal(picture, FolderName);
      }
    } else {
      objadmin.picture = "public/profile/default.png";
    }

    const getRoleId = await Role.findOne({ slug: slug(role) }).lean();
    //  objadmin.roleId = getRoleId._id; // find role ID to save admin collection
    const admin = new Admin(objadmin);
    const savedAdmin = await admin.save();
    const adminRole = new AdminRole({
      roleId: getRoleId._id,
      adminId: savedAdmin._id,
    });
    await adminRole.save();
    if (savedAdmin) {
      const objdetails = {
        contact_no: contact_no || "",
        address_1: address_1 || "",
        address_2: address_2 || "",
        city: city || "",
        pincode: pincode || "",
        is_agent: role == "operator",
        company: company || "",
        document_gst_certificate: document_gst_certificate
          ? await imageUpload(
              document_gst_certificate,
              `gst-certificate-${uuidv4()}`,
              FolderName
            )
          : "public/documents/default.jpg",
        document_pan_card: document_pan_card
          ? await imageUpload(
              document_pan_card,
              `pan-card-${uuidv4()}`,
              FolderName
            )
          : "public/documents/default.jpg",
      };
      objdetails.adminId = savedAdmin._id;
      Listeners.eventsListener.emit("Add-Admin-Detail", objdetails);
    }
    res.status(httpStatus.CREATED);
    // admin: savedAdmin.transform()
    res.json({
      message: `${role} created successfully.`,
      admin: savedAdmin.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update new admin
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const adminId = req.params.adminId;

    const {
      firstname,
      lastname,
      email,
      role,
      phone,
      contact_no,
      is_active,
      country_code,
      // admin detail fields
      address_1,
      address_2,
      city,
      pincode,
      is_agent,
      company,
      commission,
      document_gst_certificate,
      document_pan_card,
      picture,
    } = req.body;

        // ✅ Find existing admin first
    const existingAdmin = await Admin.findById(adminId);
    if (!existingAdmin) {
      return res.status(httpStatus.NOT_FOUND).json({
        code: httpStatus.NOT_FOUND,
        msg: "Admin not found",
      });
    }

    // Build update object for Admin (only include provided fields)
    const adminUpdate = {};
    if (typeof firstname !== "undefined") adminUpdate.firstname = firstname;
    if (typeof lastname !== "undefined") adminUpdate.lastname = lastname;
    if (typeof email !== "undefined") adminUpdate.email = email;

    if (typeof phone !== "undefined") adminUpdate.phone = phone;
    if (typeof country_code !== "undefined")
      adminUpdate.country_code = country_code;
    if (typeof is_active !== "undefined") adminUpdate.is_active = is_active;
    if (typeof picture !== "undefined") adminUpdate.picture = picture;

    if (typeof role !== "undefined") {
      adminUpdate.role = role;
      const getRoleId = await Role.findOne({ slug: slug(role) }).lean();
      adminUpdate.roleId = getRoleId._id;
    }

    
    // ✅ Handle picture upload
    if (req.files) {
      console.log("req.files.picture", req.files.picture);
       adminUpdate.picture = await handleImageUpload(
        req.files.picture,
        existingAdmin.picture, // use current picture as old image
        process.env.S3_BUCKET_USERPRO,
        { resize: true, width: 60, height: 60, filenamePrefix: "profile" }
      );
    }else{
    adminUpdate.picture = picture;
    }

    // Update Admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      new mongoose.Types.ObjectId(adminId),
      { $set: adminUpdate },
      { new: true }
    ).exec();

    if (!updatedAdmin) {
      throw new APIError({
        message: "Admin not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    // Build admin detail update and upsert
    const adminDetailUpdate = {};
    if (typeof contact_no !== "undefined")
      adminDetailUpdate.contact_no = contact_no;
    if (typeof address_1 !== "undefined")
      adminDetailUpdate.address_1 = address_1;
    if (typeof address_2 !== "undefined")
      adminDetailUpdate.address_2 = address_2;
    if (typeof city !== "undefined") adminDetailUpdate.city = city;
    if (typeof pincode !== "undefined") adminDetailUpdate.pincode = pincode;
    if (typeof is_agent !== "undefined") adminDetailUpdate.is_agent = is_agent;
    if (typeof company !== "undefined") adminDetailUpdate.company = company;
    if (typeof commission !== "undefined")
      adminDetailUpdate.commission = commission;
    if (typeof document_gst_certificate !== "undefined")
      adminDetailUpdate.document_gst_certificate = document_gst_certificate;
    if (typeof document_pan_card !== "undefined")
      adminDetailUpdate.document_pan_card = document_pan_card;

    if (Object.keys(adminDetailUpdate).length > 0) {
      await AdminDetail.findOneAndUpdate(
        { adminId: updatedAdmin._id },
        { $set: adminDetailUpdate },
        { upsert: true, new: true }
      ).exec();
    }

    res.status(httpStatus.OK);
    res.json({
      status: true,
      message: "Admin updated successfully.",
      admin: updatedAdmin.transform(),
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Delete Admin
 * @public
 */
exports.remove = (req, res, next) => {
  Admin.deleteOne({ _id: req.params.adminId })
    .then(() =>
      AdminDetail.deleteOne({ adminId: req.params.adminId }).then(() =>
        res.status(httpStatus.OK).json({
          status: true,
          message: " deleted successfully.",
        })
      )
    )
    .catch((e) => next(e));
};
