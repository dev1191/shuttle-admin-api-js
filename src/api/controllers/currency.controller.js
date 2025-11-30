const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const Currency = require("../models/currency.model");
const APIError = require("../utils/APIError");

exports.fetchCurrency = async (req, res, next) => {
  try {
    /**  const condition = (req.query.name != '') ? {
      $match:{
        name: { $regex: `(\s+${req.query.name}|^${req.query.name})`, $options: "i" },
        status:true
      }
    } : {
       $match :{
        status:true
       }
    };  **/

    const getCountries = await Currency.aggregate([
      {
        $match: {
          status: true,
        },
      },
      {
        $project: {
          _id: 0,
          text: { $concat: ["$name", " ", "$symbol"] },
          value: "$symbol",
        },
      },
      {
        $sort: { text: -1 },
      },
    ]);
    res.json({ data: getCountries });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Get currency
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const currency = await Currency.findById(req.params.currencyId);
    res.status(httpStatus.OK);
    res.json({
      message: "currency get successfully.",
      data: currency.transform(),
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Create new bus
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { name, code, symbol, status } = req.body;

    // Check if currency with same code already exists
    const existingCurrency = await Currency.findOne({
      $or: [
        { code: code.toUpperCase() },
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
      ],
    });

    if (existingCurrency) {
      return res.status(409).json({
        status: false,
        message: "Currency with this code or name already exists",
        data: null,
      });
    }

    const currency = await new Currency({
      name,
      code: code.toUpperCase(), // Store code in uppercase for consistency
      symbol,
      status,
    }).save();

    return res.status(201).json({
      status: true,
      message: "Currency created successfully",
      data: currency,
    });
  } catch (error) {
    console.log(error);

    // Handle MongoDB duplicate key error (if you have unique index)
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Currency with this code already exists",
        data: null,
      });
    }

    next(new APIError(error));
  }
};

/**
 * Update existing currency
 * @public
 */

exports.update = async (req, res, next) => {
  try {
    const { name, code, symbol, status } = req.body;
    const currencyexists = await Currency.findById(
      req.params.currencyId
    ).exec();
    if (currencyexists) {
      /**  if (status) { // check is status is true
        const getCurrencyStatus = await Currency.find({ status });
        const CurrencyIds = getCurrencyStatus.filter(v => v._id);
        await Currency.updateMany({ _id: { $in: CurrencyIds } }, { status: false });
      }  */

      const objUpdate = {
        name,
        code,
        symbol,
        status,
      };

      const updateCurrency = await Currency.findByIdAndUpdate(
        req.params.currencyId,
        {
          $set: objUpdate,
        },
        {
          new: true,
        }
      );
      if (updateCurrency) {
        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "Currency updated successfully",
          data: updateCurrency,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
        message: "No currency found.",
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Get currency list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    const condition = req.query.search
      ? {
          $or: [
            {
              name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              code: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              symbol: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            { status: req.query.search != "inactive" },
          ],
          is_deleted: false,
        }
      : {
          is_deleted: false,
        };

    let sort = {};
    if (!req.query.sort) {
      sort = { _id: -1 };
    } else {
      const data = JSON.parse(req.query.sort);
      sort = {
        [data.name]: data.order != "none" ? data.order : "asc",
      };
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
    };

    const result = await Currency.paginate(condition, paginationoptions);
    result.items = Currency.transformData(result.items);

    res.json(result);
  } catch (error) {
    console.log("343 ", error);
    next(error);
  }
};

/**
 * Delete bus
 * @public
 */
exports.remove = (req, res, next) => {
  Currency.updateOne(
    {
      _id: req.params.currencyId,
    },
    {
      $set: { is_deleted: true },
    }
  )
    .then(() => {
      res.status(httpStatus.OK).json({
        status: true,
        message: "Currency deleted successfully.",
      });
    })
    .catch((e) => next(e));
};
