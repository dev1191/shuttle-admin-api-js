const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");
const AdminDetail = require("../models/adminDetail.model");

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
                { status: req.query.search != "inactive" },
              ],
            },
            { role: { $ne: "operator" } },
          ],
        }
      : { role: { $ne: "operator" } };

    let sort = {};
    if (req.query.sortBy != '' && req.query.sortDesc != '') {
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
      newquery.is_deleted = false;
    } else if (req.query.status) {
      newquery.status = req.query.status ? true: false;
      newquery.is_deleted = false;
    }
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
          role: 1,
          address_1: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.address_1",
                  else: "$admin_detail.address_1",
                },
              },
              "",
            ],
          },
          address_2: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.address_2",
                  else: "$admin_detail.address_2",
                },
              },
              "",
            ],
          },
          city: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.city",
                  else: "$admin_detail.city",
                },
              },
              "",
            ],
          },
          contact_no: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.contact_no",
                  else: "$admin_detail.contact_no",
                },
              },
              "",
            ],
          },
          pincode: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.pincode",
                  else: "$admin_detail.pincode",
                },
              },
              "",
            ],
          },
          company: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.company",
                  else: "$admin_detail.company",
                },
              },
              "",
            ],
          },
          is_agent: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.is_agent",
                  else: "$admin_detail.is_agent",
                },
              },
              "",
            ],
          },
          commission: {
            $ifNull: [
              {
                $cond: {
                  if: { $eq: ["$admin_detail.is_agent", true] },
                  then: "$admin_detail.commission",
                  else: "$admin_detail.commission",
                },
              },
              "",
            ],
          },
          document_gst_certificate: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_gst_certificate",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_gst_certificate",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$document_gst_certificate",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.BASEURL}:${process.env.PORT}/public/admin/documents/default.jpg`,
                  {
                    $concat: [
                      `${process.env.BASEURL}:${process.env.PORT}/public/admin/documents/`,
                      "$document_gst_certificate",
                    ],
                  },
                ],
              },
            ],
          },
          document_pan_card: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_pan_card",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_pan_card",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$document_pan_card",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.BASE_URL}:${process.env.PORT}/public/admin/documents/default.jpg`,
                  {
                    $concat: [
                      `${process.env.BASE_URL}:${process.env.PORT}/public/admin/documents/`,
                      "$document_pan_card",
                    ],
                  },
                ],
              },
            ],
          },
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

    // const paginationoptions = {
    //   page: req.query.page || 1,
    //   limit: req.query.limit || 10,
    //   collation: { locale: 'en' },
    //   customLabels: {
    //     totalDocs: 'totalRecords',
    //     docs: 'users',
    //   },
    //   sort,
    //   populate: 'admin_details',
    //   lean: true,
    //   leanWithId: true,
    // };
    // console.log('paginationoptions', paginationoptions);
    // const result = await Admin.paginate(condition, paginationoptions);
    // result.users = Admin.transformData(result.users);
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
      address_1,
      address_2,
      company,
      city,
      pincode,
      picture,
      document_gst_certificate,
      document_pan_card,
    } = req.body;
    const FolderName = role == "operator"
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
 * Delete Admin
 * @public
 */
exports.remove = (req, res, next) => {
  Admin.deleteOne({ _id: req.params.adminId })
    .then(() => AdminDetail.deleteOne({ adminId: req.params.adminId }).then(() => res.status(httpStatus.OK).json({
          status: true,
          message: " deleted successfully.",
        })
      )
    )
    .catch((e) => next(e));
};
