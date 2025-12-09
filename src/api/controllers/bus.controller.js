const httpStatus = require("http-status");
const mongoose = require("mongoose");
const { omit, isEmpty } = require("lodash");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const { v4: uuidv4 } = require("uuid");
const Listeners = require("../events/Listener");
const Bus = require("../models/bus.model");
const Route = require("../models/route.model");
const busSchedule = require("../models/busSchedule.model");
const Bus_galleries = require("../models/busGallaries.model");
const { imageDelete, imageUpload } = require("../services/uploaderService");

/**
 * check bus with the Plate/Registration number.
 * @public
 */
exports.isRegistrationExists = async (req, res, next) => {
  try {
    const { reg_no, name, model_no, chassis_no, type } = req.body;
    const isExists = await Bus.countDocuments({
      $or: [
        { reg_no: reg_no },
        { name: name },
        { model_no: model_no },
        { chassis_no: chassis_no },
      ],
    });

    if (isExists && isExists > 1) {
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
  } catch (error) {
    return next(error);
  }
};

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next) => {
  try {
    let condition =
      req.query.search != ""
        ? {
            title: {
              $regex: `(\s+${req.query.search}|^${req.query.search})`,
              $options: "i",
            },
            status: true,
          }
        : {
            status: true,
          };

    const getBuses = await Bus.aggregate([
      { $match: condition },
      {
        $project: {
          _id: 0,
          label: "$name",
          value: "$_id",
        },
      },
      {
        $sort: { label: -1 },
      },
    ]);
    res.json({ items: getBuses });
  } catch (error) {
    return next(error);
  }
};

/**
 * Load user and append to req.
 * @public
 */
exports.loadByRoute = async (req, res, next) => {
  try {
    //const getTimetable = await TimeTable.find({status:true},"busId");
    //const getBusId = getTimetable.map((v) => { return v.busId });
    const getBuses = await Bus.find({}).populate("buslayoutId").lean();
    console.log("getBuses", getBuses);
    res.status(httpStatus.OK);
    res.json({
      message: "Bus Type load data.",
      data: Bus.transformOptions(getBuses),
      status: true,
    });
  } catch (error) {
    console.log("error", error);
    return next(error);
  }
};

/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const bus = await Bus.findById(req.params.busId).populate("bustypeId");
    res.status(httpStatus.OK);
    res.json({
      message: "Bus fetched successfully.",
      data: Bus.transformData(bus),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 *  upload single  documents
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const { busId } = req.params;
    const { document_type } = req.params;
    console.log(busId);
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
      const FolderName = process.env.S3_BUCKET_BUS;
      const base64Image = req.file.buffer.toString("base64");
      const base64 = `data:${req.file.mimetype};base64,${base64Image}`;
      const s3Dataurl = await imageUpload(
        base64,
        `${busId}-${document_type}`,
        FolderName
      ); // upload data to aws s3
      if (s3Dataurl) {
        if (document_type == "registration") {
          const update = {
            certificate_registration: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "Pollution") {
          const update = {
            certificate_pollution: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "insurance") {
          const update = {
            certificate_insurance: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "fitness") {
          const update = {
            certificate_fitness: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "permit") {
          const update = {
            certificate_permit: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "picture") {
          const update = {
            picture: s3Dataurl,
          };

          await Bus.updateOne(
            {
              _id: busId,
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        } else if (document_type == "gallery") {
          const update = {
            image_url: s3Dataurl,
          };

          await Bus_galleries.updateOne(
            {
              busId: { $eq: busId },
            },
            update
          );
          res.status(httpStatus.OK);
          res.json({
            message: "Bus document uploaded successfully.",
            bus_gallery: { document_type, pathUrl: s3Dataurl },
            status: true,
          });
        }
      } else {
        res.status(httpStatus.NOT_FOUND);
        res.json({
          message: "Bus document uploaded failed.",
          status: false,
        });
      }
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Create new bus
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const {
      bustypeId,
      buslayoutId,
      operatorId,
      name,
      brand,
      model_no,
      chassis_no,
      picture,
      reg_no,
      amenities,
      certificate_registration,
      certificate_pollution,
      certificate_insurance,
      certificate_fitness,
      certificate_permit,
      status,
    } = req.body;

    // Determine operatorId: use from body, or from logged-in user if operator role
    let finalOperatorId = operatorId;
    if (req.user && req.user.role === "operator") {
      finalOperatorId = req.user._id; // Operators can only create buses for themselves
    }

    if (!finalOperatorId) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: false,
        message: "Operator ID is required",
      });
    }

    const FolderName = process.env.S3_BUCKET_BUS;
    const objBus = {
      operatorId: finalOperatorId,
      bustypeId,
      buslayoutId,
      name,
      reg_no,
      brand,
      model_no,
      chassis_no,
      status,
      amenities,
      picture,
      certificate_registration,
      certificate_pollution,
      certificate_insurance,
      certificate_fitness,
      certificate_permit,
    };

    const bus = new Bus(objBus);
    const savedBus = await bus.save();
    Listeners.eventsListener.emit("CREATE-TICKET", savedBus._id); // event to ASSIGNED ticket to driver

    res.status(httpStatus.CREATED);
    return res.json({
      message: "Bus created successfully.",
      bus: savedBus,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing bus
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    // Check if only status is being updated
    const requestKeys = Object.keys(req.body);
    const isStatusOnlyUpdate =
      requestKeys.length === 1 && requestKeys[0] === "status";

    if (isStatusOnlyUpdate) {
      const { status } = req.body;
      // Quick status-only update
      const updatebus = await Bus.findByIdAndUpdate(
        req.params.busId,
        {
          $set: { status },
        },
        {
          new: true,
        }
      );

      const transformedBus = updatebus.transform();
      res.status(httpStatus.OK);
      return res.json({
        status: true,
        message: "Bus status updated successfully.",
        data: transformedBus,
      });
    }

    // Full update with image processing
    const busexists = await Bus.findById(req.params.busId).exec();

    // Check operator ownership
    if (req.user && req.user.role === "operator") {
      if (
        !busexists.operatorId ||
        busexists.operatorId.toString() !== req.user._id.toString()
      ) {
        return res.status(httpStatus.FORBIDDEN).json({
          status: false,
          message: "You do not have permission to update this bus",
        });
      }
    }

    const FolderName = process.env.S3_BUCKET_BUS;

    const objUpdate = {
      operatorId: req.body.operatorId || busexists.operatorId,
      bustypeId: req.body.bustypeId,
      buslayoutId: req.body.buslayoutId,
      name: req.body.name,
      reg_no: req.body.reg_no,
      status: req.body.status,
      brand: req.body.brand,
      model_no: req.body.model_no,
      chassis_no: req.body.chassis_no,
      amenities: req.body.amenities,
      picture: req.body.picture,
      certificate_registration: req.body.certificate_registration,
      certificate_pollution: req.body.certificate_pollution,
      certificate_insurance: req.body.certificate_insurance,
      certificate_fitness: req.body.certificate_fitness,
      certificate_permit: req.body.certificate_permit,
    };

    const updatebus = await Bus.findByIdAndUpdate(
      req.params.busId,
      {
        $set: objUpdate,
      },
      {
        new: true,
      }
    );

    const transformedBus = updatebus.transform();
    res.status(httpStatus.OK);
    res.json({
      status: true,
      message: "Bus updated successfully.",
      data: transformedBus,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bus list
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
                  name: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                // {
                //   max_seats: {
                //     $regex: new RegExp(req.query.search),
                //     $options: "i",
                //   },
                // },
                {
                  reg_no: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  brand: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  model_no: {
                    $regex: new RegExp(req.query.search),
                    $options: "i",
                  },
                },
                {
                  chassis_no: {
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
                { status: req.query.search != "inactive" },
              ],
            },
          ],
        }
      : {};

    // Filter by operator if user is an operator
    if (req.user && req.user.role === "operator") {
      condition.operatorId = req.user._id;
    }

    // Allow filtering by specific operatorId (admin only)
    if (req.query.operatorId && req.user && req.user.role !== "operator") {
      condition.operatorId = new mongoose.Types.ObjectId(req.query.operatorId);
    }

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    const aggregateQuery = Bus.aggregate([
      {
        $lookup: {
          from: "admins",
          localField: "operatorId",
          foreignField: "_id",
          as: "operator",
        },
      },
      {
        $unwind: {
          path: "$operator",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "bus_layouts",
          localField: "buslayoutId",
          foreignField: "_id",
          as: "buslayout",
        },
      },
      {
        $unwind: "$buslayout",
      },
      {
        $lookup: {
          from: "bus_types",
          localField: "bustypeId",
          foreignField: "_id",
          as: "bustype",
        },
      },
      {
        $unwind: "$bustype",
      },
      {
        $project: {
          ids: "$_id",
          name: 1,
          reg_no: 1,
          brand: 1,
          code: 1,
          model_no: 1,
          chassis_no: 1,
          type: { $ifNull: ["$bustype.name", ""] },
          layout: { $ifNull: ["$buslayout.name", ""] },
          max_seats: { $ifNull: ["$buslayout.max_seats", ""] },
          operator_name: {
            $concat: [
              { $ifNull: ["$operator.firstname", ""] },
              " ",
              { $ifNull: ["$operator.lastname", ""] },
            ],
          },
          operatorId: "$operatorId",
          picture: 1,
          amenities: 1,
          certificate_registration: 1,
          certificate_pollution: 1,
          certificate_insurance: 1,
          certificate_fitness: 1,
          certificate_permit: 1,
          status: 1,
          createdAt: 1,
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

    const result = await Bus.aggregatePaginate(aggregateQuery, options);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = async (req, res, next) => {
  try {
    const FolderName = process.env.S3_BUCKET_BUS;

    if (await busSchedule.exists({ busId: req.params.busId })) {
      res.status(httpStatus.OK).json({
        status: false,
        message: "Remove the bus schedule first!",
      });
    } else if (await Bus.exists({ _id: req.params.busId })) {
      const busexists = await Bus.findOne({ _id: req.params.busId });
      if (Bus.isValidURL(busexists.picture)) {
        await imageDelete(busexists.picture, FolderName);
      }
      if (Bus.isValidURL(busexists.certificate_registration)) {
        await imageDelete(busexists.certificate_registration, FolderName);
      }
      if (Bus.isValidURL(busexists.certificate_pollution)) {
        await imageDelete(busexists.certificate_pollution, FolderName);
      }
      if (Bus.isValidURL(busexists.certification_insurance)) {
        await imageDelete(busexists.certification_insurance, FolderName);
      }
      if (Bus.isValidURL(busexists.certificate_fitness)) {
        await imageDelete(busexists.certificate_fitness, FolderName);
      }
      if (Bus.isValidURL(busexists.certificate_permit)) {
        await imageDelete(busexists.certificate_permit, FolderName);
      }

      //Listeners.eventsListener.emit("REMOVE-TICKET", req.params.busId); // event to ASSIGNED ticket to driver
      const deleteBus = await Bus.deleteOne({ _id: req.params.busId });
      if (deleteBus) {
        res.status(httpStatus.OK).json({
          status: true,
          message: "Bus deleted successfully.",
        });
      }
    }
  } catch (e) {
    next(e);
  }
};
