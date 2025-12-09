const httpStatus = require("http-status");
const mongoose = require("mongoose");
const Admin = require("../models/admin.model");
const AdminDetail = require("../models/adminDetail.model");
const OperatorEarnings = require("../models/operatorEarnings.model");
const Bus = require("../models/bus.model");
const Driver = require("../models/driver.model");
const BusSchedule = require("../models/busSchedule.model");
const Booking = require("../models/booking.model");
const Setting = require("../models/setting.model");
const Role = require("../models/role.model");
const slug = require("slug");
const { v4: uuidv4 } = require("uuid");
const APIError = require("../utils/APIError");
const emailProvider = require("../services/emails/emailProvider");
const { handleImageUpload } = require("../utils/imageHandler");

/**
 * List all operators
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $and: [
            {
              $or: [
                {
                  firstname: {
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
              ],
            },
            { role: "operator" },
          ],
        }
      : { role: "operator" };

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
    }

    // Filter by operator status if provided
    if (req.query.operator_status) {
      newquery["admin_detail.operator_status"] = req.query.operator_status;
    }

    condition = { ...condition, ...newquery };

    const aggregateQuery = Admin.aggregate([
      {
        $lookup: {
          from: "admin_details",
          localField: "_id",
          foreignField: "adminId",
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
          // Operator-specific fields
          operator_license_number: "$admin_detail.operator_license_number",
          operator_business_name: "$admin_detail.operator_business_name",
          operator_status: "$admin_detail.operator_status",
          operator_commission: "$admin_detail.operator_commission",
          operator_approved_at: "$admin_detail.operator_approved_at",
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
    console.log("error", error);
    next(error);
  }
};

/**
 * Get operator profile
 * @public
 */
exports.getProfile = async (req, res, next) => {
  try {
    const operatorId = req.user._id; // From auth middleware

    const operator = await Admin.findById(operatorId).lean();
    if (!operator) {
      throw new APIError({
        message: "Operator not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    const operatorDetail = await AdminDetail.findOne({
      adminId: operatorId,
    }).lean();

    // Get operator stats
    const [busCount, driverCount, scheduleCount, bookingCount, earnings] =
      await Promise.all([
        Bus.countDocuments({ operatorId }),
        Driver.countDocuments({ operatorId }),
        BusSchedule.countDocuments({ operatorId }),
        Booking.countDocuments({ operatorId }),
        OperatorEarnings.getEarningsSummary(operatorId),
      ]);

    res.json({
      status: true,
      operator: {
        ...operator,
        ...operatorDetail,
        stats: {
          total_buses: busCount,
          total_drivers: driverCount,
          total_schedules: scheduleCount,
          total_bookings: bookingCount,
          earnings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get operator dashboard stats
 * @public
 */
exports.getDashboard = async (req, res, next) => {
  try {
    const operatorId = req.user._id;

    // Get date ranges
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(today);
    monthStart.setMonth(monthStart.getMonth() - 1);

    // Get earnings by period
    const [todayEarnings, weekEarnings, monthEarnings, totalEarnings] =
      await Promise.all([
        OperatorEarnings.aggregate([
          {
            $match: {
              operatorId: new mongoose.Types.ObjectId(operatorId),
              createdAt: { $gte: today, $lt: tomorrow },
            },
          },
          { $group: { _id: null, total: { $sum: "$operator_earnings" } } },
        ]),
        OperatorEarnings.aggregate([
          {
            $match: {
              operatorId: new mongoose.Types.ObjectId(operatorId),
              createdAt: { $gte: weekStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$operator_earnings" } } },
        ]),
        OperatorEarnings.aggregate([
          {
            $match: {
              operatorId: new mongoose.Types.ObjectId(operatorId),
              createdAt: { $gte: monthStart },
            },
          },
          { $group: { _id: null, total: { $sum: "$operator_earnings" } } },
        ]),
        OperatorEarnings.getEarningsSummary(operatorId),
      ]);

    // Get booking counts
    const [todayBookings, totalBookings, activeBookings] = await Promise.all([
      Booking.countDocuments({
        operatorId,
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      Booking.countDocuments({ operatorId }),
      Booking.countDocuments({
        operatorId,
        travel_status: { $in: ["SCHEDULED", "ONBOARDED", "STARTED"] },
      }),
    ]);

    // Get resource counts
    const [busCount, driverCount, scheduleCount] = await Promise.all([
      Bus.countDocuments({ operatorId, status: { $ne: "Inactive" } }),
      Driver.countDocuments({ operatorId, status: true }),
      BusSchedule.countDocuments({ operatorId, status: true }),
    ]);

    // Get recent bookings
    const recentBookings = await Booking.find({ operatorId })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("userId", "firstname lastname email phone")
      .populate("busId", "name reg_no")
      .populate("routeId", "title")
      .lean();

    res.json({
      status: true,
      dashboard: {
        earnings: {
          today: todayEarnings[0]?.total || 0,
          week: weekEarnings[0]?.total || 0,
          month: monthEarnings[0]?.total || 0,
          total: totalEarnings,
        },
        bookings: {
          today: todayBookings,
          total: totalBookings,
          active: activeBookings,
        },
        resources: {
          buses: busCount,
          drivers: driverCount,
          schedules: scheduleCount,
        },
        recent_bookings: recentBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get operator earnings
 * @public
 */
exports.getEarnings = async (req, res, next) => {
  try {
    const operatorId = req.user._id;

    let condition = { operatorId: new mongoose.Types.ObjectId(operatorId) };

    // Filter by payout status
    if (req.query.payout_status) {
      condition.payout_status = req.query.payout_status;
    }

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      condition.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      };
    }

    const aggregateQuery = OperatorEarnings.aggregate([
      { $match: condition },
      {
        $lookup: {
          from: "bookings",
          localField: "bookingId",
          foreignField: "_id",
          as: "booking",
        },
      },
      {
        $unwind: {
          path: "$booking",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    const options = {
      page: req.query.page || 1,
      limit: req.query.limit || 20,
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
    };

    const result = await OperatorEarnings.aggregatePaginate(
      aggregateQuery,
      options
    );

    // Get earnings summary
    const summary = await OperatorEarnings.getEarningsSummary(operatorId);

    res.json({
      status: true,
      ...result,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register new operator
 * @public
 */
exports.register = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      country_code,
      password,
      operator_business_name,
      operator_license_number,
      company,
      address_1,
      address_2,
      city,
      pincode,
      contact_no,
    } = req.body;

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new APIError({
        message: "Email already registered",
        status: httpStatus.CONFLICT,
      });
    }

    // Get default commission from settings
    const settings = await Setting.findOne({});
    const defaultCommission = settings?.operator_default_commission || 10;

    // Create admin account
    const admin = new Admin({
      firstname,
      lastname,
      email,
      phone,
      country_code: country_code || "91",
      password: password || phone,
      role: "operator",
      is_active: false, // Inactive until approved
      picture: "public/profile/default.png",
    });

    const savedAdmin = await admin.save();

    // Get operator role
    const operatorRole = await Role.findOne({ slug: "operator" });
    if (operatorRole) {
      const AdminRole = require("../models/adminRole.model");
      await AdminRole.create({
        roleId: operatorRole._id,
        adminId: savedAdmin._id,
      });
    }

    // Create operator detail
    const operatorDetail = new AdminDetail({
      adminId: savedAdmin._id,
      is_operator: true,
      operator_business_name,
      operator_license_number,
      operator_commission: defaultCommission,
      operator_status: "pending",
      company: company || operator_business_name,
      address_1: address_1 || "",
      address_2: address_2 || "",
      city: city || "",
      pincode: pincode || "",
      contact_no: contact_no || phone,
    });

    await operatorDetail.save();

    // Send registration email
    try {
      await emailProvider.sendEmail({
        to: email,
        subject: "Operator Registration Received",
        template: "operator_registered",
        data: {
          firstname,
          lastname,
          operator_business_name,
        },
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.status(httpStatus.CREATED).json({
      status: true,
      message:
        "Operator registration submitted successfully. Awaiting admin approval.",
      operator: savedAdmin.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create operator (Admin only)
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      firstname,
      lastname,
      email,
      phone,
      country_code,
      password,
      operator_business_name,
      operator_license_number,
      operator_commission,
      company,
      address_1,
      address_2,
      city,
      pincode,
      contact_no,
      is_active,
      picture,
    } = req.body;

    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new APIError({
        message: "Email already registered",
        status: httpStatus.CONFLICT,
      });
    }

    // Get default commission from settings if not provided
    const settings = await Setting.findOne({});
    const defaultCommission =
      operator_commission || settings?.operator_default_commission || 10;

    const FolderName = process.env.S3_BUCKET_USERPRO;

    // Create admin account
    const admin = new Admin({
      firstname,
      lastname,
      email,
      phone,
      country_code: country_code || "91",
      password: password || phone,
      role: "operator",
      is_active: is_active !== undefined ? is_active : true, // Admin can activate immediately
      picture: picture || "public/profile/default.png",
    });

    const savedAdmin = await admin.save();

    // Get operator role
    const operatorRole = await Role.findOne({ slug: "operator" });
    if (operatorRole) {
      const AdminRole = require("../models/adminRole.model");
      await AdminRole.create({
        roleId: operatorRole._id,
        adminId: savedAdmin._id,
      });
    }

    // Create operator detail
    const operatorDetail = new AdminDetail({
      adminId: savedAdmin._id,
      is_operator: true,
      operator_business_name,
      operator_license_number,
      operator_commission: defaultCommission,
      operator_status: is_active ? "active" : "pending",
      operator_approved_by: is_active ? req.user._id : null,
      operator_approved_at: is_active ? new Date() : null,
      company: company || operator_business_name,
      address_1: address_1 || "",
      address_2: address_2 || "",
      city: city || "",
      pincode: pincode || "",
      contact_no: contact_no || phone,
    });

    await operatorDetail.save();

    // Send welcome email if active
    if (is_active) {
      try {
        await emailProvider.sendEmail({
          to: email,
          subject: "Welcome to Our Platform",
          template: "operator_approved",
          data: {
            firstname,
            lastname,
            operator_business_name,
          },
        });
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    res.status(httpStatus.CREATED).json({
      status: true,
      message: "Operator created successfully.",
      operator: savedAdmin.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single operator (Admin only)
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const { operatorId } = req.params;

    const operator = await Admin.findById(operatorId).lean();
    if (!operator || operator.role !== "operator") {
      throw new APIError({
        message: "Operator not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    const operatorDetail = await AdminDetail.findOne({
      adminId: operatorId,
    }).lean();

    // Get operator stats
    const [busCount, driverCount, scheduleCount, bookingCount, earnings] =
      await Promise.all([
        Bus.countDocuments({ operatorId }),
        Driver.countDocuments({ operatorId }),
        BusSchedule.countDocuments({ operatorId }),
        Booking.countDocuments({ operatorId }),
        OperatorEarnings.getEarningsSummary(operatorId),
      ]);

    res.json({
      status: true,
      message: "Operator fetched successfully.",
      data: {
        ...operator,
        ...operatorDetail,
        stats: {
          total_buses: busCount,
          total_drivers: driverCount,
          total_schedules: scheduleCount,
          total_bookings: bookingCount,
          earnings,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update operator (Admin only)
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { operatorId } = req.params;

    const {
      firstname,
      lastname,
      email,
      phone,
      country_code,
      is_active,
      operator_business_name,
      operator_license_number,
      operator_commission,
      operator_status,
      company,
      address_1,
      address_2,
      city,
      pincode,
      contact_no,
      picture,
    } = req.body;

    // Find existing operator
    const existingAdmin = await Admin.findById(operatorId);
    if (!existingAdmin || existingAdmin.role !== "operator") {
      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        message: "Operator not found",
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

    // Update Admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      operatorId,
      { $set: adminUpdate },
      { new: true }
    );

    // Build admin detail update
    const adminDetailUpdate = {};
    if (typeof operator_business_name !== "undefined")
      adminDetailUpdate.operator_business_name = operator_business_name;
    if (typeof operator_license_number !== "undefined")
      adminDetailUpdate.operator_license_number = operator_license_number;
    if (typeof operator_commission !== "undefined")
      adminDetailUpdate.operator_commission = operator_commission;
    if (typeof operator_status !== "undefined") {
      adminDetailUpdate.operator_status = operator_status;
      // If status is being changed to active, record approval
      if (operator_status === "active") {
        adminDetailUpdate.operator_approved_by = req.user._id;
        adminDetailUpdate.operator_approved_at = new Date();
      }
    }
    if (typeof company !== "undefined") adminDetailUpdate.company = company;
    if (typeof address_1 !== "undefined")
      adminDetailUpdate.address_1 = address_1;
    if (typeof address_2 !== "undefined")
      adminDetailUpdate.address_2 = address_2;
    if (typeof city !== "undefined") adminDetailUpdate.city = city;
    if (typeof pincode !== "undefined") adminDetailUpdate.pincode = pincode;
    if (typeof contact_no !== "undefined")
      adminDetailUpdate.contact_no = contact_no;

    if (Object.keys(adminDetailUpdate).length > 0) {
      await AdminDetail.findOneAndUpdate(
        { adminId: operatorId },
        { $set: adminDetailUpdate },
        { upsert: true, new: true }
      );
    }

    res.status(httpStatus.OK).json({
      status: true,
      message: "Operator updated successfully.",
      operator: updatedAdmin.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve operator (Admin only)
 * @public
 */
exports.approve = async (req, res, next) => {
  try {
    const { operatorId } = req.params;
    const { commission_percentage } = req.body;
    const approvedBy = req.user._id; // Admin who is approving

    const operator = await Admin.findById(operatorId);
    if (!operator || operator.role !== "operator") {
      throw new APIError({
        message: "Operator not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    // Update operator status
    await Admin.findByIdAndUpdate(operatorId, { is_active: true });

    const updateData = {
      operator_status: "active",
      operator_approved_by: approvedBy,
      operator_approved_at: new Date(),
    };

    if (commission_percentage) {
      updateData.operator_commission = commission_percentage;
    }

    await AdminDetail.findOneAndUpdate({ adminId: operatorId }, updateData);

    // Send approval email
    try {
      await emailProvider.sendEmail({
        to: operator.email,
        subject: "Operator Account Approved",
        template: "operator_approved",
        data: {
          firstname: operator.firstname,
          lastname: operator.lastname,
        },
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.json({
      status: true,
      message: "Operator approved successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reject operator (Admin only)
 * @public
 */
exports.reject = async (req, res, next) => {
  try {
    const { operatorId } = req.params;
    const { rejection_reason } = req.body;

    const operator = await Admin.findById(operatorId);
    if (!operator || operator.role !== "operator") {
      throw new APIError({
        message: "Operator not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    await AdminDetail.findOneAndUpdate(
      { adminId: operatorId },
      {
        operator_status: "rejected",
        operator_rejection_reason: rejection_reason || "Not specified",
      }
    );

    // Send rejection email
    try {
      await emailProvider.sendEmail({
        to: operator.email,
        subject: "Operator Application Update",
        template: "operator_rejected",
        data: {
          firstname: operator.firstname,
          lastname: operator.lastname,
          rejection_reason: rejection_reason || "Not specified",
        },
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.json({
      status: true,
      message: "Operator rejected",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Suspend operator (Admin only)
 * @public
 */
exports.suspend = async (req, res, next) => {
  try {
    const { operatorId } = req.params;

    await Admin.findByIdAndUpdate(operatorId, { is_active: false });
    await AdminDetail.findOneAndUpdate(
      { adminId: operatorId },
      { operator_status: "suspended" }
    );

    res.json({
      status: true,
      message: "Operator suspended successfully",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update operator profile
 * @public
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const operatorId = req.user._id;

    const {
      firstname,
      lastname,
      phone,
      country_code,
      operator_business_name,
      operator_license_number,
      company,
      address_1,
      address_2,
      city,
      pincode,
      contact_no,
      picture,
    } = req.body;

    const existingAdmin = await Admin.findById(operatorId);
    if (!existingAdmin) {
      throw new APIError({
        message: "Operator not found",
        status: httpStatus.NOT_FOUND,
      });
    }

    // Build update object for Admin
    const adminUpdate = {};
    if (typeof firstname !== "undefined") adminUpdate.firstname = firstname;
    if (typeof lastname !== "undefined") adminUpdate.lastname = lastname;
    if (typeof phone !== "undefined") adminUpdate.phone = phone;
    if (typeof country_code !== "undefined")
      adminUpdate.country_code = country_code;

    // Handle picture upload
    if (req.files && req.files.picture) {
      adminUpdate.picture = await handleImageUpload(
        req.files.picture,
        existingAdmin.picture,
        process.env.S3_BUCKET_USERPRO,
        {
          resize: true,
          width: 60,
          height: 60,
          filenamePrefix: "operator-profile",
        }
      );
    } else if (picture) {
      adminUpdate.picture = picture;
    }

    // Update Admin
    const updatedAdmin = await Admin.findByIdAndUpdate(
      operatorId,
      { $set: adminUpdate },
      { new: true }
    );

    // Build operator detail update
    const detailUpdate = {};
    if (typeof operator_business_name !== "undefined")
      detailUpdate.operator_business_name = operator_business_name;
    if (typeof operator_license_number !== "undefined")
      detailUpdate.operator_license_number = operator_license_number;
    if (typeof company !== "undefined") detailUpdate.company = company;
    if (typeof address_1 !== "undefined") detailUpdate.address_1 = address_1;
    if (typeof address_2 !== "undefined") detailUpdate.address_2 = address_2;
    if (typeof city !== "undefined") detailUpdate.city = city;
    if (typeof pincode !== "undefined") detailUpdate.pincode = pincode;
    if (typeof contact_no !== "undefined") detailUpdate.contact_no = contact_no;

    if (Object.keys(detailUpdate).length > 0) {
      await AdminDetail.findOneAndUpdate(
        { adminId: operatorId },
        { $set: detailUpdate }
      );
    }

    res.json({
      status: true,
      message: "Profile updated successfully",
      operator: updatedAdmin.transform(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request payout (Operator only)
 * @public
 */
exports.requestPayout = async (req, res, next) => {
  try {
    const operatorId = req.user._id;
    const { amount, payout_method, notes } = req.body;

    // Get pending earnings
    const pendingEarnings = await OperatorEarnings.getTotalEarnings(
      operatorId,
      "pending"
    );

    if (pendingEarnings < amount) {
      throw new APIError({
        message: `Insufficient balance. Available: ${pendingEarnings}`,
        status: httpStatus.BAD_REQUEST,
      });
    }

    // Get settings for minimum payout
    const settings = await Setting.findOne({});
    const minPayout = settings?.operator_min_payout_amount || 1000;

    if (amount < minPayout) {
      throw new APIError({
        message: `Minimum payout amount is ${minPayout}`,
        status: httpStatus.BAD_REQUEST,
      });
    }

    // Update earnings to processing status
    await OperatorEarnings.updateMany(
      {
        operatorId,
        payout_status: "pending",
      },
      {
        $set: {
          payout_status: "processing",
          payout_method: payout_method || "bank_transfer",
          notes: notes || "",
        },
      },
      { limit: Math.ceil(amount / pendingEarnings) }
    );

    res.json({
      status: true,
      message: "Payout request submitted successfully",
      amount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = exports;
