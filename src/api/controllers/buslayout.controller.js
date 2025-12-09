const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const BusLayout = require("../models/busLayout.model");
const Bus = require("../models/bus.model");

/**
 * Load user and append to req.
 * @public
 */
exports.load = async (req, res, next) => {
    try {
      let condition = req.query.search != ""
          ? {
              name: {
                $regex: `(\s+${req.query.search}|^${req.query.search})`,
                $options: "i",
              },
              status: true,
            }
          : {
              status: true,
            };
  
      const getBusLayouts = await BusLayout.aggregate([
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
      res.json({ items: getBusLayouts });
    } catch (error) {
      console.log(error);
      throw new APIError(error);
    }
};

/**
 * Get bus type
 * @public
 */
exports.get = async (req, res) => {
  try {
    const buslayout = await BusLayout.findById(req.params.buslayoutId);
    res.status(httpStatus.OK);
    res.json({
      message: "Bus Layout successfully.",
      data: buslayout.transform(),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

/**
 * Create new bus layout
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const buslayout = new BusLayout(req.body);
    const savedBusLayout = await buslayout.save();
    res.status(httpStatus.CREATED);
    res.json({
      message: "Bus layout created successfully.",
      buslayout: savedBusLayout.transform(),
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bus layout list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.search
      ? {
          $or: [
            { name: { $regex: new RegExp(req.query.search), $options: "i" } },
            {
              max_seats: {
                $regex: new RegExp(req.query.search),
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

    const result = await BusLayout.paginate(condition, paginationoptions);
    result.items = BusLayout.transformData(result.items);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

/**
 * Update existing bus layout
 * @public
 */
exports.update = async (req, res, next) => {
  try {
    const updatebuslayout = await BusLayout.findByIdAndUpdate(
      req.params.buslayoutId,
      {
        $set: {
          name: req.body.name,
          max_seats: req.body.max_seats,
          seat_lists: req.body.seat_lists,
          steering: req.body.steering,
          rows: req.body.rows,
          columns: req.body.columns,
          status: req.body.status,
        },
      },
      {
        new: true,
      }
    );
    const transformedBusLayout = updatebuslayout.transform();
    res.json({
      message: "Bus layout updated successfully.",
      buslayout: transformedBusLayout,
      status: true,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bus type
 * @public
 */
exports.remove = (req, res, next) => {
  Bus.findOne({ buslayoutId: req.params.buslayoutId })
    .then((result) => {
      if (result) {
        res.status(httpStatus.OK).json({
          status: false,
          message: `Please delete bus name ${result.name} first.`,
        });
      } else {
        BusLayout.deleteOne({
          _id: req.params.buslayoutId,
        })
          .then(() =>
            res.status(httpStatus.OK).json({
              status: true,
              message: "Bus layout deleted successfully.",
            })
          )
          .catch((e) => next(e));
      }
    })
    .catch((e) => next(e));
};
