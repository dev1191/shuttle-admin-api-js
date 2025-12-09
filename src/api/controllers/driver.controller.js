const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const base64Img = require("base64-img");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const { v4: uuidv4 } = require("uuid");
const mongoose = require("mongoose");
const Driver = require("../models/driver.model");
const Setting = require("../models/setting.model");
const {
  imageDelete,
  imageUpload,
  uploadLocal,
  deleteLocal,
} = require("../services/uploaderService");
const faker = require("../helpers/faker");
const { BASEURL, port, FULLBASEURL } = require("../../config/vars");
const APIError = require("../utils/APIError");

exports.testData = (req, res) => {
  const d = faker.seedDrivers("123456");
  res.status(httpStatus.OK);
  res.json({ d });
};

/**
 * check Driver with the driver is exists.
 * @public
 */
exports.isDriverExists = async (req, res, next) => {
  try {
    const { name, id } = req.body;
    if (name && name != "") {
      const isExists = await Driver.findOne({
        $or: [
          { national_id: { $regex: new RegExp(name), $options: "i" } },
          { phone: { $regex: new RegExp(name), $options: "i" } },
          { email: { $regex: new RegExp(name), $options: "i" } },
        ],
        _id: { $nin: [new mongoose.Types.ObjectId(id)] },
      });
      console.log(`isExists : phone`, isExists);
      if (isExists) {
        res.status(httpStatus.OK);
        res.json({
          status: false,
        });
      } else {
        res.status(httpStatus.OK);
        res.json({
          status: true,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
      });
    }
  } catch (error) {
    return next(error);
  }
};

/**
 * Get user
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const driver = await Driver.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(req.params.driverId) },
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          operatorId: 1,
          firstname: 1,
          lastname: 1,
          country_code: 1,
          email: 1,
          phone: 1,
          type: 1,
          national_id: 1,
          duty_status: { $ifNull: ["$duty_status", "OFFLINE"] },
          document_licence: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_licence",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_licence",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$document_licence",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
                  {
                    $concat: [
                      `${process.env.FULL_BASEURL}public/drivers/documents/`,
                      "$document_licence",
                    ],
                  },
                ],
              },
              //  `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
            ],
          },
          document_national_icard: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_national_icard",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_national_icard",
              `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
            ],
          },
          document_police_vertification: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_police_vertification",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_police_vertification",
              `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
            ],
          },
          status: 1,
          // status: {
          //   $cond: {
          //     if: { $eq: ["$status", true] },
          //     then: "Active",
          //     else: "InActive",
          //   },
          // },
          picture: {
            $cond: [
              {
                $regexMatch: {
                  input: "$picture",
                  regex: /^(http|https):\/\//,
                },
              },
              "$picture",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$picture",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.FULL_BASEURL}public/drivers/profiles/default.jpg`,
                  {
                    $concat: [
                      `${process.env.FULL_BASEURL}public/drivers/profiles/`,
                      "$picture",
                    ],
                  },
                ],
              },
            ],
          },
        },
      },
    ]);
    if (driver.length > 0) {
      res.status(httpStatus.OK);
      res.json({
        message: "Driver get successfully.",
        data: driver[0],
        status: true,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "Driver not found.",
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Load driver and append to req.
 * @public
 */
exports.load = async (req, res, next, id) => {
  try {
    const driver = await Driver.get(id);
    req.locals = {
      driver,
    };
    return next();
  } catch (error) {
    throw new APIError(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const condition = search
      ? {
          $or: [
            {
              firstname: { $regex: `(\s+${search}|^${search})`, $options: "i" },
            },
            { lastname: { $regex: new RegExp(search), $options: "i" } },
            { phone: { $regex: new RegExp(search), $options: "i" } },
            { email: { $regex: new RegExp(search), $options: "i" } },
            { national_id: { $regex: new RegExp(search), $options: "i" } },
          ],
          type,
          is_deleted: false,
        }
      : { type, is_deleted: false };
    const result = await Driver.find(condition).lean();
    res.json({
      total_count: result.length,
      items: await Driver.formatDriver(result),
    });
  } catch (error) {
    throw new APIError(error);
  }
};

/**
 * Update existing user status
 * @public
 */
exports.status = async (req, res, next) => {
  try {
    const { status, type } = req.body;
    const update = await Driver.updateOne(
      { _id: req.params.driverId },
      { status: status == "Active" ? "true" : "false" }
    );
    if (update.n > 0) {
      res.json({
        message: `${type} status now is ${status}.`,
        status: true,
      });
    } else {
      res.json({
        message: `updated failed.`,
        status: false,
      });
    }
  } catch (error) {
    throw new APIError(error);
  }
};

/**
 *  upload single  documents
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    const { document_type } = req.body;
    if (!req.file) {
      res.status(httpStatus.NOT_FOUND);
      res.json({
        message: "no file to uploaded.",
        status: false,
      });
    } else if (req.file.size > 300000) {
      // 2mb size
      res.status(httpStatus.NOT_FOUND);
      res.json({
        message: "file size 3mb limit.",
        status: false,
      });
    } else {
      const FolderName = process.env.S3_BUCKET_DRIVERDOC;
      const base64Image = req.file.buffer.toString("base64");
      const base64 = `data:${req.file.mimetype};base64,${base64Image}`;
      const s3Dataurl = await imageUpload(
        base64,
        `${driverId}-${document_type}`,
        FolderName
      ); // upload data to aws s3
      if (s3Dataurl) {
        if (document_type == "license") {
          const update = {
            document_licence: s3Dataurl,
          };

          await Driver.updateOne(
            {
              _id: driverId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Driver document uploaded successfully.",
            driver: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "adhar_card") {
          const update = {
            document_national_icard: s3Dataurl,
          };

          await Driver.updateOne(
            {
              _id: driverId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Driver document uploaded successfully.",
            driver: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else {
          const update = {
            document_police_vertification: s3Dataurl,
          };

          await Driver.updateOne(
            {
              _id: driverId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Driver document uploaded successfully.",
            driver: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        }
      } else {
        res.status(httpStatus.NOT_FOUND);
        res.json({
          message: "Driver document uploaded successfully.",
          status: false,
        });
      }
    }
  } catch (error) {
    throw new APIError(error);
  }
};

/**
 * Create new driver
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      operatorId,
      firstname,
      lastname,
      email,
      type,
      national_id,
      country_code,
      phone,
      status,
      picture,
      document_licence,
      document_national_icard,
      document_police_vertification,
    } = req.body;

    // Determine operatorId: use from body, or from logged-in user if operator role
    let finalOperatorId = operatorId;
    if (req.user && req.user.role === "operator") {
      finalOperatorId = req.user._id; // Operators can only create drivers for themselves
    }

    if (!finalOperatorId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: "Operator ID is required",
      });
    }

    const FolderName = process.env.S3_BUCKET_DRIVERDOC;
    const objDriver = {
      operatorId: finalOperatorId,
      firstname,
      lastname,
      email,
      country_code,
      phone,
      status,
      type,
      national_id,
    };

    const isProductionS3 = await Setting.gets3();

    if (picture && (await Setting.isValidBase64(picture))) {
      if (isProductionS3.is_production) {
        objDriver.picture = await imageUpload(
          picture,
          `profile_${uuidv4()}`,
          FolderName
        );
      } else {
        objDriver.picture = await uploadLocal(picture, FolderName);
      }
    }

    if (document_licence && (await Setting.isValidBase64(picture))) {
      if (isProductionS3.is_production) {
        objDriver.document_licence = await imageUpload(
          document_licence,
          `document_licence_${uuidv4()}`,
          FolderName
        );
      } else {
        objDriver.document_licence = await uploadLocal(
          document_licence,
          FolderName
        );
      }
    }

    if (document_national_icard && (await Setting.isValidBase64(picture))) {
      if (isProductionS3.is_production) {
        objDriver.document_national_icard = await imageUpload(
          document_national_icard,
          `document_national_icard_${uuidv4()}`,
          FolderName
        );
      } else {
        objDriver.document_national_icard = await uploadLocal(
          document_national_icard,
          FolderName
        );
      }
    }

    if (
      document_police_vertification &&
      (await Setting.isValidBase64(picture))
    ) {
      if (isProductionS3.is_production) {
        objDriver.document_police_vertification = await imageUpload(
          document_police_vertification,
          `document_police_vertification_${uuidv4()}`,
          FolderName
        );
      } else {
        objDriver.document_police_vertification = await uploadLocal(
          document_police_vertification,
          FolderName
        );
      }
    }

    const driver = new Driver(objDriver);
    const savedDriver = await driver.save();
    res.status(httpStatus.CREATED);
    res.json({
      message: "Driver created successfully.",
      driver: savedDriver.transform(),
      status: true,
    });
  } catch (error) {
    next(Driver.checkDuplicateEmail(error));
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const driverexists = await Driver.findById(req.params.driverId).exec();

    // Check operator ownership
    if (req.user && req.user.role === "operator") {
      if (
        !driverexists.operatorId ||
        driverexists.operatorId.toString() !== req.user._id.toString()
      ) {
        return res.status(httpStatus.FORBIDDEN).json({
          status: false,
          message: "You do not have permission to update this driver",
        });
      }
    }

    const objUpdate = {
      operatorId: req.body.operatorId || driverexists.operatorId,
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      country_code: req.body.country_code,
      phone: req.body.phone,
      status: req.body.status,
      type: req.body.type,
      national_id: req.body.national_id,
      picture: req.body.picture,
      document_licence: req.body.document_licence,
      document_national_icard: req.body.document_national_icard,
      document_police_vertification: req.body.document_police_vertification,
    };

    const updatedrivers = await Driver.findByIdAndUpdate(
      req.params.driverId,
      {
        $set: objUpdate,
      },
      {
        new: true,
      }
    );

    const transformedDrivers = updatedrivers.transform();
    res.status(httpStatus.CREATED);
    res.json({
      message: "Driver update successfully.",
      data: transformedDrivers,
      status: true,
    });
  } catch (error) {
    console.log("error ", error);
    throw new APIError(error);
  }
};

/**
 * Get driver list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    //  const drivers = await Driver.list(req.query);
    let condition = req.query.search
      ? {
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
            {
              type: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              national_id: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
          ],
          is_deleted: false,
        }
      : {
          is_deleted: false,
        };

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
      newquery.is_deleted = false;
    } else if (req.query.status) {
      newquery.status = req.query.status ? true : false;
      newquery.is_deleted = false;
    }
    condition = { ...condition, ...newquery };

    // Filter by operator if user is an operator
    if (req.user && req.user.role === "operator") {
      condition.operatorId = req.user._id;
    }

    // Allow filtering by specific operatorId (admin only)
    if (req.query.operatorId && req.user && req.user.role !== "operator") {
      condition.operatorId = new mongoose.Types.ObjectId(req.query.operatorId);
    }

    const aggregateQuery = Driver.aggregate([
      {
        $lookup: {
          from: "admins",
          localField: "operatorId",
          foreignField: "_id",
          as: "operator",
        },
      },
      {
        $unwind: "$operator",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          is_deleted: 1,
          operator_name: {
            $ifNull: [
              { $concat: ["$operator.firstname", " ", "$operator.lastname"] },
              "-",
            ],
          },
          operatorId: "$operatorId",
          firstname: 1,
          lastname: 1,
          country_code: 1,
          national_id: 1,
          fullname: { $concat: ["$firstname", " ", "$lastname"] },
          email: 1,
          phone: 1,
          type: 1,
          duty_status: { $ifNull: ["$duty_status", "OFFLINE"] },
          document_licence: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_licence",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_licence",
              {
                $cond: [
                  {
                    $regexMatch: {
                      input: "$document_licence",
                      regex: /^(default):\/\//,
                    },
                  },
                  `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
                  {
                    $concat: [
                      `${process.env.FULL_BASEURL}public/drivers/documents/`,
                      "$document_licence",
                    ],
                  },
                ],
              },
              //  `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
            ],
          },
          document_national_icard: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_national_icard",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_national_icard",
              `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
            ],
          },
          document_police_vertification: {
            $cond: [
              {
                $regexMatch: {
                  input: "$document_police_vertification",
                  regex: /^(http|https):\/\//,
                },
              },
              "$document_police_vertification",
              `${process.env.FULL_BASEURL}public/drivers/documents/default.jpg`,
            ],
          },
          status: 1,
          createdAt: 1,
          picture: 1,
        },
      },
      {
        $match: condition,
      },
    ]);

    //    console.log('1212', sort);

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

    const result = await Driver.aggregatePaginate(aggregateQuery, options);

    //const result = await Driver.paginate(condition, paginationoptions);
    // const transformedDrivers = drivers.map(driver => driver.transform());
    // console.log('qweqwe', result);
    //  result.drivers = Driver.transformData(result.drivers);
    res.json(result);
  } catch (error) {
    throw new APIError(error);
  }
};

/**
 * Delete driver
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const FolderName = process.env.S3_BUCKET_DRIVERDOC;
    const isProductionS3 = await Setting.gets3();
    if (await Driver.exists({ _id: req.params.driverId })) {
      const getdriver = await Driver.findOne({ _id: req.params.driverId });
      if (Driver.isValidURL(getdriver.picture)) {
        if (isProductionS3.is_production) {
          await imageDelete(getdriver.picture, FolderName);
        } else {
          await deleteLocal(getdriver.picture, FolderName);
        }
      }
      if (Driver.isValidURL(getdriver.document_licence)) {
        if (isProductionS3.is_production) {
          await imageDelete(getdriver.document_licence, FolderName);
        } else {
          await deleteLocal(getdriver.document_licence, FolderName);
        }
      }
      if (Driver.isValidURL(getdriver.document_national_icard)) {
        if (isProductionS3.is_production) {
          await imageDelete(getdriver.document_national_icard, FolderName);
        } else {
          await deleteLocal(getdriver.document_national_icard, FolderName);
        }
      }
      if (Driver.isValidURL(getdriver.document_police_vertification)) {
        if (isProductionS3.is_production) {
          await imageDelete(
            getdriver.document_police_vertification,
            FolderName
          );
        } else {
          await deleteLocal(
            getdriver.document_police_vertification,
            FolderName
          );
        }
      }

      const deleteDriver = await Driver.deleteOne({ _id: req.params.driverId });
      if (deleteDriver) {
        res.status(httpStatus.OK).json({
          status: true,
          message: "Driver deleted successfully.",
        });
      }
    }
  } catch (e) {
    throw new APIError(e);
  }
};
