const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const { VARIANT_ALSO_NEGOTIATES } = require("http-status");
const Country = require("../models/country.model");
const APIError = require("../utils/APIError");

exports.fetchCountry = async (req, res, next) => {
  try {
    const getCountries = await Country.aggregate([
      {
        $project: {
          _id: 0,
          text: "$name",
          value: "$name",
        },
      },
    ]);
    res.json({ data: getCountries });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Get country list
 * @public
 */
exports.load = async (req, res, next) => {
  try {
    const { search } = req.query;
    const condition = search
      ? {
          $or: [
            {
              name: { $regex: `(\s+${search}|^${search})`, $options: "i" },
            },
            { short_name: { $regex: new RegExp(search), $options: "i" } },
            { phone_code: { $regex: new RegExp(search), $options: "i" } },
          ],
          is_deleted: false,
        }
      : { is_deleted: false };
    const result = await Country.find(condition).lean();
    res.status(httpStatus.OK);
    res.json({
      total_count: result.length,
      items: await Country.formatCountry(result),
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Get country
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const country = await Country.findById(req.params.countryId);
    res.status(httpStatus.OK);
    res.json({
      message: "country get successfully.",
      data: country.transform(),
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
    const { name, short_name, phone_code, status } = req.body;

    // Check if country with same code already exists
    const existingCountry = await Country.findOne({
      $or: [
        { short_name: short_name.toUpperCase() },
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
      ],
    });

    if (existingCountry) {
      return res.status(409).json({
        status: false,
        message: "Country with this code or name already exists",
        data: null,
      });
    }

    const newCountry = await new Country({
      name,
      short_name: short_name.toUpperCase(), // Store code in uppercase for consistency
      phone_code,
      status,
    }).save();

    return res.status(201).json({
      status: true,
      message: "Country created successfully",
      data: newCountry,
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "Country with this code already exists",
        data: null,
      });
    }

    next(new APIError(error));
  }
};
/**
 * Update existing country
 * @public
 */

exports.update = async (req, res, next) => {
  try {
    const countryId = req.params.countryId;
    const { name, short_name, phone_code, symbol, status } = req.body;

    const exists = await Country.findById(countryId);
    if (!exists) {
      return res.json({ status: false, message: "No country found." });
    }

    const onlyStatus = status !== undefined && !name && !short_name && !phone_code && !symbol;

    // Only status update
    if (onlyStatus) {
      const updated = await Country.findByIdAndUpdate(
        countryId,
        { $set: { status } },
        { new: true }
      );
      return res.json({
        status: true,
        message: "Status updated",
        data: updated,
      });
    }

    // Full update + set all other countries inactive if status=true
    if (status === true) {
      await Country.updateMany(
        { _id: { $ne: countryId } },
        { $set: { status: false } }
      );
    }

    const updateObj = { name, short_name, phone_code, symbol, status };
    Object.keys(updateObj).forEach(
      (key) => updateObj[key] === undefined && delete updateObj[key]
    );

    const updated = await Country.findByIdAndUpdate(
      countryId,
      { $set: updateObj },
      { new: true }
    );

    return res.json({
      status: true,
      message: "Country updated",
      data: updated,
    });
  } catch (err) {
    next(new APIError(err));
  }
};

/**
 * Get country list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    let condition = req.query.search
      ? {
          $or: [
            {
              name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              short_name: {
                $regex: new RegExp(req.query.search),
                $options: "i",
              },
            },
            {
              phone_code: {
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
    if (req.query.sortBy != '' && req.query.sortDesc != '') {
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
    };

    const aggregateQuery = Country.aggregate([
      {
        $project: {
          _id: 0,
          ids: "$_id",
          name: 1,
          short_name: 1,
          phone_code: 1,
          status: 1,
          is_deleted: 1,
        },
      },
      {
        $match: condition,
      },
    ]);

    const result = await Country.aggregatePaginate(
      aggregateQuery,
      paginationoptions
    );

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
exports.remove = async (req, res, next) => {
  try {
    if (await Country.exists({ _id: req.params.countryId, status: true })) {
      res.status(httpStatus.OK).json({
        status: false,
        message: "Country status is active. please inactive first.",
      });
    } else {
      const result = await Country.updateOne(
        { _id: req.params.countryId },
        { $set: { is_deleted: true } }
      );
      if (result) {
        res.status(httpStatus.OK).json({
          status: true,
          message: "Country deleted successfully.",
        });
      } else {
        res.status(httpStatus.OK).json({
          status: false,
          message: "Country failed to deleted.",
        });
      }
    }
  } catch (err) {
    console.log("343 ", error);
    next(error);
  }
};
