const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Driver = require("../models/driver.model");
const APIError = require("../utils/APIError");

/**
 * Get the Active driver list
 * @public
 */
exports.driverData = async (req, res, next) => {
  try {
    const { search, duty_status } = req.query;
    let condition = {};

    if (search != "") {
      condition = {
        $match: {
          $and: [
            {
              type: "driver",
            },
            { status: true },
            { duty_status: duty_status },
          ],
          $or: [
            {
              firstname: {
                $regex: new RegExp(search),
                $options: "i",
              },
            },
            {
              lastname: {
                $regex: new RegExp(search),
                $options: "i",
              },
            },
            {
              phone: {
                $regex: new RegExp(search),
                $options: "i",
              },
            },
          ],
        },
      };
    } else {
      condition = {
        $match: {
          $and: [
            {
              type: "driver",
            },
            { status: true },
            { duty_status: req.query.duty_status },
          ],
        },
      };
    }
    const driver = await Driver.aggregate([
      condition,
      {
        $project: {
          _id: 0,
          ids: "$_id",
          fullname: {
            $ifNull: [{ $concat: ["$firstname", " ", "$lastname"] }, ""],
          },
          phone: 1,
          country_code: 1,
          picture: 1,
          duty_status: 1,
          location: [
            {
              $ifNull: [
                { $arrayElemAt: ["$currentLocation.coordinates", 1] },
                0,
              ],
            },
            {
              $ifNull: [
                { $arrayElemAt: ["$currentLocation.coordinates", 0] },
                0,
              ],
            },
          ],
        },
      },
    ]);

    res.status(httpStatus.OK);
    res.json({
      message: "Driver get successfully.",
      data: driver,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * SSE stream for live driver tracking
 * @public
 */
exports.stream = async (req, res, next) => {
  try {
    const { search } = req.query;

    // Build base query (always group by duty_status on server side)
    const baseQuery = { type: "driver", status: true };
    if (search) {
      baseQuery.$or = [
        { firstname: { $regex: new RegExp(search), $options: "i" } },
        { lastname: { $regex: new RegExp(search), $options: "i" } },
      ];
    }

    // Send initial data grouped by duty_status
    try {
      const DUTY_STATUSES = ["OFFLINE", "TRACKING", "ONLINE"];
      const groups = await Driver.aggregate([
        { $match: baseQuery },
        {
          $project: {
            _id: 0,
            id: "$_id",
            fullname: {
              $ifNull: [{ $concat: ["$firstname", " ", "$lastname"] }, ""],
            },
            phone: 1,
            country_code: 1,
            picture: 1,
            duty_status: 1,
            location: [
              {
                $ifNull: [
                  { $arrayElemAt: ["$currentLocation.coordinates", 0] },
                  0,
                ],
              },
              {
                $ifNull: [
                  { $arrayElemAt: ["$currentLocation.coordinates", 1] },
                  0,
                ],
              },
            ],
          },
        },
        { $group: { _id: "$duty_status", drivers: { $push: "$$ROOT" } } },
        { $project: { _id: 0, duty_status: "$_id", drivers: 1 } },
      ]).exec();

      // convert to map for easier client consumption
      const grouped = {};

      // initialize all statuses with empty arrays
      DUTY_STATUSES.forEach((status) => {
        grouped[status] = [];
      });

      // fill from DB results
      groups.forEach((g) => {
        const key = g.duty_status || "OFFLINE"; // default if null or missing
        if (!grouped[key]) grouped[key] = [];
        grouped[key] = g.drivers;
      });
      res.write(
        `data: ${JSON.stringify({ type: "initial", groups: grouped })}\n\n`
      );
    } catch (err) {
      console.error("Error fetching initial drivers for SSE:", err);
    }

    // Try to open change stream (requires MongoDB replica set)
    let changeStream;
    try {
      changeStream = Driver.watch(
        [{ $match: { operationType: { $in: ["update", "replace"] } } }],
        { fullDocument: "updateLookup" }
      );
    } catch (err) {
      console.error(
        "ChangeStream unavailable or not supported in current MongoDB setup:",
        err.message || err
      );
      changeStream = null;
    }

    if (changeStream) {
      changeStream.on("change", async () => {
        try {
          const groups = await Driver.aggregate([
            { $match: baseQuery },
            {
              $project: {
                _id: 0,
                id: "$_id",
                fullname: {
                  $ifNull: [{ $concat: ["$firstname", " ", "$lastname"] }, ""],
                },
                phone: 1,
                country_code: 1,
                picture: 1,
                duty_status: 1,
                location: [
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$currentLocation.coordinates", 1] },
                      0,
                    ],
                  },
                  {
                    $ifNull: [
                      { $arrayElemAt: ["$currentLocation.coordinates", 0] },
                      0,
                    ],
                  },
                ],
              },
            },
            { $group: { _id: "$duty_status", drivers: { $push: "$$ROOT" } } },
            { $project: { _id: 0, duty_status: "$_id", drivers: 1 } },
          ]).exec();

          const grouped = {};
          groups.forEach((g) => {
            grouped[g.duty_status || "unknown"] = g.drivers;
          });
          res.write(
            `data: ${JSON.stringify({ type: "update", groups: grouped })}\n\n`
          );
        } catch (err) {
          console.error("Error handling change stream event for SSE:", err);
        }
      });

      changeStream.on("error", (err) => {
        console.error("Driver changeStream error:", err);
      });
    }

    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      try {
        res.write(":heartbeat\n\n");
      } catch (e) {
        // ignore write errors
      }
    }, 30000);

    // Cleanup on client disconnect
    req.on("close", () => {
      clearInterval(heartbeatInterval);
      if (changeStream && changeStream.close) {
        try {
          changeStream.close();
        } catch (e) {
          // ignore
        }
      }
      try {
        res.end();
      } catch (e) {
        // ignore
      }
    });
  } catch (error) {
    console.error("SSE stream error:", error);
    // For SSE, we cannot send res.json, so just close the connection
    res.end();
  }
};
