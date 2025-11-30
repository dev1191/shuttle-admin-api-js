const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Suggest = require("../models/suggest.model");

/**
 * Get role
 * @public
 */
exports.get = async (req, res) => {
  try {
    const suggest = await Suggest.findById(req.params.suggestId)
      .populate({ path: "userId", select: "firstname lastname" })
      .lean();
    res.status(httpStatus.OK);
    res.json({
      message: "Suggest fetched successfully.",
      data: Suggest.transformSingleData(suggest),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get bsu layout list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              pickup_address: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              drop_address: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              fullname: {
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
        }
      : {};

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
    } else if (req.query.payment_status) {
      newquery.payment_status = req.query.payment_status;
    }
    condition = { ...condition, ...newquery };

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
    const aggregateQuery = Suggest.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          ids: "$_id",
          pickup_address: "$pickup.address",
          drop_address: "$drop.address",
          fullname: { $concat: ["$user.firstname", " ", "$user.lastname"] },
          phone: { $concat: ["$user.country_code", " ", "$user.phone"] },
          picture: "$user.picture",
          createdAt: 1,
        },
      },
      {
        $match: condition,
      },
    ]);

    const result = await Suggest.aggregatePaginate(
      aggregateQuery,
      paginationoptions
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};
