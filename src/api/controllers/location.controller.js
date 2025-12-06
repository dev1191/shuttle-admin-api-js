const httpStatus = require("http-status");
const { v4: uuidv4 } = require("uuid");
const { omit } = require("lodash");
const Location = require("../models/location.model");
const { imageDelete, imageUpload } = require("../services/uploaderService");
const { handleImageUpload } = require("../utils/imageHandler");

const Route = require("../models/route.model");
const RouteStop = require("../models/routeStop.model");

/**
 * check stops with the title.
 * @public
 */
exports.istitleExists = async (req, res, next) => {
  try {
    const { title } = req.body;
    const isExists = await Location.countDocuments({
      $or: [{ title: title }],
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

exports.load = async (req, res) => {
 try {
    let condition = req.query.search != ""
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

    const getLocations = await Location.aggregate([
      { $match: condition },
      {
        $project: {
          _id: 0,
          label:"$title",
          value: "$_id",
        },
      },
      {
        $sort: { label: -1 },
      },
    ]);
    res.json({ items: getLocations });
  } catch (error) {
    console.log(error);
    return error;
  }
};


exports.status = async (req, res, next) => {
  try {
    const { status } = req.body;

    const update = await Location.updateOne(
      { _id: req.params.locationId },
      { status: status }
    );

    if (update.matchedCount > 0) {
      res.json({
        message: `status now is ${status}.`,
        status: true,
      });
    } else {
      res.json({
        message: `update failed.`,
        status: false,
      });
    }
  } catch (error) {
    next(error);
  }
};


/**
 * Get bus
 * @public
 */
exports.get = async (req, res) => {
  try {
    const location = await Location.findById(req.params.locationId);
    res.status(httpStatus.OK);
    res.json({
      message: "stop fetched successfully.",
      data: Location.transformData(location),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Create new location
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { title, landmark, lat, lng, status, type } = req.body;
    const FolderName = process.env.S3_BUCKET_LOCATION;
    let lastIntegerId = 1;
    const lastRoute = await Location.findOne({}).sort({ integer_id: -1 });

    if (lastRoute && lastRoute.integer_id) {
      lastIntegerId = parseInt(lastRoute.integer_id) + 1;
    }

    const locationObject = {
      title,
      landmark,
      location: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      type,
      status,
      integer_id: lastIntegerId,
    };
    // Accept multipart uploads (req.files.files), single file (req.files.file), or base64 array in req.body.files
    let pictures = [];
    const incoming = (req.files && (req.files.files || req.files.file || req.files.picture))
      || req.body.files
      || null;
    const fileArray = [];
    if (Array.isArray(incoming)) {
      fileArray.push(...incoming);
    } else if (incoming) {
      fileArray.push(incoming);
    }

    if (fileArray.length > 0) {
      const uploaded = await Promise.all(
        fileArray.map((f) => handleImageUpload(f, null, FolderName, { resize: false })
        )
      );
      pictures = uploaded.filter(Boolean);
    }

    locationObject.files = pictures;

    const location = await new Location(locationObject).save();
    res.status(httpStatus.CREATED);
    res.json({
      message: "Stop created successfully.",
      location: location.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing location
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const { title, landmark, lat, lng, status, type, files } = req.body;
    const updateObj = {
      title,
      landmark,
      location: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      },
      type,
      status,
      files,
    };

    const updatelocations = await Location.findByIdAndUpdate(
      req.params.locationId,
      {
        $set: updateObj,
      },
      {
        new: true,
      }
    );
    const transformedUsers = updatelocations.transform();
    res.json({
      message: "Stop updated successfully.",
      bustype: transformedUsers,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get location list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    // const locations = await Location.list(req.query);
    // const transformedUsers = locations.map(location => location.transform());
    let condition = req.query.search
      ? {
          $or: [
            {
              title: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
            {
              landmark: {
                $regex:
                  "(s+" + req.query.search + "|^" + req.query.search + ")",
                $options: "i",
              },
            },
          ],
        }
      : {};

    let sort = {};
    if (req.query.sortBy != "" && req.query.sortDesc != "") {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    }

    const paginationoptions = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      collation: { locale: "en" },
      customLabels: {
        totalDocs: "totalRecords",
        docs: "items",
      },
      sort,
      lean: true,
    };

    const result = await Location.paginate(condition, paginationoptions);
    result.items = Location.transformDataLists(result.items);
    res.json(result);
  } catch (error) {
    console.log("error: ", error);
    next(error);
  }
};

exports.search = async (req, res, next) => {
  try {
    const { search, type } = req.query;
    const condition = search
      ? {
          // $or: [
          title: { $regex: `(\s+${search}|^${search})`, $options: "i" },
          type,
          // { 'location.address': { $regex: new RegExp(search), $options: 'i' } },
          //  ],
        }
      : { type: type };
    const result = await Location.find(condition).lean();
    console.log("result", result);
    res.json({
      total_count: result.length,
      items: Location.formatLocation(result),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete location
 * @public
 */
exports.remove = (req, res, next) => {
  RouteStop.exists({ stopId: req.params.locationId }).then((result) => {
    if (result) {
      res.status(httpStatus.OK).json({
        status: false,
        message: "Remove the stop from route first!",
      });
    } else {
      Location.deleteOne({ _id: req.params.locationId })
        .then(() => res.status(httpStatus.OK).json({
            status: true,
            message: "stop deleted successfully.",
          })
        )
        .catch((e) => next(e));
    }
  });
};
