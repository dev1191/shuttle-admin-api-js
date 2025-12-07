const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const BusSchedule = require("../models/busSchedule.model");
const busScheduleLocation = require("../models/busScheduleLocation.model");

exports.search = async (req, res, next) => {
  try {
    const { search } = req.query;

    const condition = search
      ? {
          // $or: [
          route_name: { $regex: `(\s+${search}|^${search})`, $options: "i" },
          status: true,
        }
      : { status: true };
    const result = await BusSchedule.aggregate([
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          status: 1,
          routeId: { $ifNull: ["$route._id", ""] },
          route_name: { $ifNull: [{ $concat: ["$route.title"] }, "-"] },
          departure_time: 1,
          arrival_time: 1,
        },
      },
      {
        $match: condition,
      },
      {
        $sort: {
          route_name: -1,
        },
      },
    ]); //find(condition).lean();
    res.json({
      total_count: result.length,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List bus schedule
 * @public
 */
exports.list = async (req, res) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              title: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            // { max_seats: { $regex: new RegExp(req.query.search), $options: 'i' } },
            // {layout : { $regex: new RegExp(req.query.search), $options: 'i' } },
            { status: req.query.search != "InActive" },
            // { last_seat: req.query.search != false},
          ],
        }
      : {};

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    if (req.query.routeId) {
      condition = { routeId: new mongoose.Types.ObjectId(req.query.routeId) };
    }

    const aggregateQuery = BusSchedule.aggregate([
      //   {
      //     $lookup: {
      //       from: "bus_schedule_locations",
      //       let: { busScheduleId: "$_id" },
      //       pipeline: [
      //         {
      //           $match: { $expr: { $eq: ["$busScheduleId", "$$busScheduleId"] } },
      //         },
      //         {
      //           $lookup: {
      //             from: "locations",
      //             let: { stopId: "$stopId" },
      //             pipeline: [
      //               { $match: { $expr: { $eq: ["$_id", "$$stopId"] } } },
      //               {
      //                 $project: {
      //                   _id: 0,
      //                   title: 1,
      //                 },
      //               },
      //             ],
      //             as: "location",
      //           },
      //         },
      //         {
      //           $unwind: "$location",
      //         },
      //         {
      //           $project: {
      //             location: 1,
      //             stopId: 1,
      //             departure_time: 1,
      //             arrival_time: 1,
      //           },
      //         },
      //       ],
      //       as: "bus_schedule_location",
      //     },
      //   },
      {
        $lookup: {
          from: "buses",
          localField: "busId",
          foreignField: "_id",
          as: "bus",
        },
      },
      {
        $unwind: "$bus",
      },
      {
        $lookup: {
          from: "routes",
          localField: "routeId",
          foreignField: "_id",
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          routeId: 1,
          bus_name: {
            $ifNull: [{ $concat: ["$bus.name", "(", "$bus.code", ")"] }, "-"],
          },
          route_name: { $ifNull: ["$route.title", "-"] },
          start_date: 1,
          end_date: 1,
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
      limit: req.query.limit || 5,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
    };

    const result = await BusSchedule.aggregatePaginate(aggregateQuery, options);

    res.status(httpStatus.OK);
    res.json(result);
  } catch (error) {
    console.log(error);
    return error;
  }
};
/**
 * Get bus schedule
 * @public
 */
exports.get = async (req, res) => {
  try {
    const getBusSchedule = await BusSchedule.aggregate([
      {
        $lookup: {
          from: "bus_schedule_locations",
          let: { busScheduleId: "$_id" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$busScheduleId", "$$busScheduleId"] } },
            },
            {
              $lookup: {
                from: "locations",
                let: { stopId: "$stopId" },
                pipeline: [
                  {
                    $match: {
                      $and: [{ $expr: { $eq: ["$_id", "$$stopId"] } }],
                    },
                  },
                  {
                    $project: {
                      _id: 0,
                      title: 1,
                    },
                  },
                ],
                as: "location",
              },
            },
            {
              $unwind: "$location",
            },
            {
              $project: {
                location: 1,
                stopId: 1,
                stop_name: "$location.title",
                departure_time: 1,
                arrival_time: 1,
                order: 1,
              },
            },
            {
              $sort: { order: 1 },
            },
          ],
          as: "bus_schedule_location",
        },
      },
      {
        $lookup: {
          from: "routes",
          //   localField: "routeId",
          //   foreignField: "_id",
          let: { routeId: "$routeId" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$_id", "$$routeId"] } },
            },
            {
              $project: {
                _id: 0,
                id: "$_id",
                title: 1,
              },
            },
          ],
          as: "route",
        },
      },
      {
        $unwind: "$route",
      },
      {
        $project: {
          _id: 0,
          id: "$_id",
          stops: {
            $map: {
              input: "$bus_schedule_location",
              as: "schedule_location",
              in: {
                id: "$$schedule_location._id",
                stopId: "$$schedule_location.stopId",
                stop_name: "$$schedule_location.stop_name",
                order: "$$schedule_location.order",
                departure_time: {
                  $cond: [
                    { $ne: ["$$schedule_location.departure_time", null] },
                    {
                      $let: {
                        vars: {
                          hrs: { $floor: { $divide: ["$$schedule_location.departure_time", 60] } },
                          mins: { $mod: ["$$schedule_location.departure_time", 60] },
                        },
                        in: {
                          $concat: [
                            {
                              $cond: [
                                { $lt: ["$$hrs", 10] },
                                { $concat: ["0", { $toString: "$$hrs" }] },
                                { $toString: "$$hrs" },
                              ],
                            },
                            ":",
                            {
                              $cond: [
                                { $lt: ["$$mins", 10] },
                                { $concat: ["0", { $toString: "$$mins" }] },
                                { $toString: "$$mins" },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    null,
                  ],
                },
                arrival_time: {
                  $cond: [
                    { $ne: ["$$schedule_location.arrival_time", null] },
                    {
                      $let: {
                        vars: {
                          hrs: { $floor: { $divide: ["$$schedule_location.arrival_time", 60] } },
                          mins: { $mod: ["$$schedule_location.arrival_time", 60] },
                        },
                        in: {
                          $concat: [
                            {
                              $cond: [
                                { $lt: ["$$hrs", 10] },
                                { $concat: ["0", { $toString: "$$hrs" }] },
                                { $toString: "$$hrs" },
                              ],
                            },
                            ":",
                            {
                              $cond: [
                                { $lt: ["$$mins", 10] },
                                { $concat: ["0", { $toString: "$$mins" }] },
                                { $toString: "$$mins" },
                              ],
                            },
                          ],
                        },
                      },
                    },
                    null,
                  ],
                },
              },
            },
          },
          every: 1,
          routeId: { $ifNull: ["$route.id", null] },
          route_name: { $ifNull: ["$route.title", null] },
          busId: 1,
          start_date: 1,
          end_date: 1,
          status: 1,
          createdAt: 1,
        },
      },
      {
        $match: { id: new mongoose.Types.ObjectId(req.params.busScheduleId) },
      },
    ]);

    res.status(httpStatus.OK);
    res.json(getBusSchedule[0]);
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create  bus schedule
 * @public
 */
exports.create = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      every,
      routeId,
      busId,
      start_date,
      end_date,
      stops,
      status,
    } = req.body;

    const busSchedule = await BusSchedule.create(
      [
        {
          every,
          routeId,
          busId,
          start_date,
          end_date,
          status,
        }
      ],
      { session }
    );

    const scheduleId = busSchedule[0]._id;

    // IMPORTANT: must pass session to your custom function
    await busScheduleLocation.createOrUpdate(scheduleId, stops, session);

    await session.commitTransaction();
    session.endSession();

    return res.status(httpStatus.CREATED).json({
      status: true,
      message: "bus schedule create successfully",
    });

  } catch (error) {
    console.log(error);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ status: false, error });
  }
};


/**
 * Update bus schedule
 * @public
 */
exports.update = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      every,
      routeId,
      busId,
      start_date,
      end_date,
      stops,
      status,
    } = req.body;

    const busSchedule = await BusSchedule.findById(
      req.params.busScheduleId
    ).session(session);

    if (!busSchedule) {
      await session.abortTransaction();
      session.endSession();

      return res.status(httpStatus.NOT_FOUND).json({
        status: false,
        message: "Bus schedule not found",
      });
    }

    const updateObj = {
      every,
      routeId,
      busId,
      start_date,
      end_date,
      status,
    };

    await BusSchedule.findByIdAndUpdate(
      req.params.busScheduleId,
      { $set: updateObj },
      { new: true, session }
    );

    // IMPORTANT: pass session
    await busScheduleLocation.deleteMany({
      busScheduleId: req.params.busScheduleId,
    }).session(session);
    await busScheduleLocation.createOrUpdate(
      req.params.busScheduleId,
      stops,
      session
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(httpStatus.OK).json({
      status: true,
      message: "Bus schedule updated successfully",
    });

  } catch (error) {
    console.log("error", error);
    await session.abortTransaction();
    session.endSession();
    return next(error);
  }
};


/**
 * Update Status bus schedule
 * @param status
 * @public
 */
exports.status = async (req, res) => {
  try {
    const { status } = req.body;
    const update = await BusSchedule.updateOne(
      { _id: req.params.busScheduleId },
      { status: status == "Active" ? "true" : "false" }
    );
    if (update) {
      res.json({
        message: `status now is ${status}.`,
        status: true,
      });
    } else {
      res.json({
        message: `updated failed.`,
        status: false,
      });
    }
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Delete bus schedule
 * @public
 */
exports.remove = async (req, res) => {
  BusSchedule.deleteOne({
    _id: req.params.busScheduleId,
  })
    .then(async () => {
      await busScheduleLocation.deleteMany({
        busScheduleId: req.params.busScheduleId,
      });
      res.status(httpStatus.OK).json({
        status: true,
        message: "Bus Schedule deleted successfully.",
      });
    })
    .catch((e) => next(e));
};
