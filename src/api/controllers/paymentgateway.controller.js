const httpStatus = require("http-status");
const mongoose = require("mongoose");
const paymentGateway = require("../models/paymentGateway.model");
const APIError = require("../utils/APIError");

/**
 *  update payment is enabled
 * @public
 */
exports.isEnabled = async (req, res, next) => {
  try {
    const getPaymentGateway = await paymentGateway.findOne({
      is_enabled: "1",
    });

    if (getPaymentGateway) {
      res.status(httpStatus.OK);
      res.json({
        message: `Please disabled the payment gateway ${getPaymentGateway.site} first.`,
        status: false,
      });
    } else {
      res.status(httpStatus.OK);
      res.json({
        message: "",
        status: true,
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 *  update payment settings
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const getPaymentGateway = await paymentGateway.aggregate([
      {
        $group: {
          _id: "$site", // Group by the 'site' field
          name: { $push: { id: "$_id", name: "$name", value: "$value" } }, // Collect the associated 'name' and 'value' fields for each site
          is_enabled: {
            $max: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$name", "is_enabled"] },
                    { $eq: ["$value", "1"] },
                  ],
                },
                1,
                0,
              ], // Check if 'name' is 'is_enabled' and 'value' is 1
            },
          },
        },
      },
      {
        $addFields: {
          site_slug: {
            $replaceAll: {
              input: { $toLower: "$_id" }, // Convert 'site' to lowercase
              find: " ",
              replacement: "_", // Replace spaces with underscores
            },
          },
        },
      },
      {
        $project: {
          _id: 1, // Include the site name as '_id'
          site_slug: 1, // Include the slug
          name: 1, // Include the keys array
          is_enabled: {
            $cond: { if: { $eq: ["$is_enabled", 1] }, then: true, else: false },
          }, // Set 'is_enabled' to true if it's 1, otherwise false
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    // const getPaymentGateway = await paymentGateway.find({
    //   site: req.params.site,
    // });
    // const convertedObject = {};

    // getPaymentGateway.forEach((item) => {
    //   convertedObject[item.name] = item.value;
    // });
    res.status(httpStatus.OK);
    res.json({
      message: `payment setting fetched successfully.`,
      data: getPaymentGateway,
      status: true,
    });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 *  update payment settings
 * @public
 */
exports.update = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    // Start session
    await session.startTransaction();
    const { _id, site_slug, name, is_enabled } = req.body;
    const { paymentName } = req.query;

    if (name && name.length > 0) {
      const operations = name.map((data) => ({
        updateOne: {
          filter: {
            site: _id,
            name: data.name,
            _id:
              new mongoose.Types.ObjectId(data.id)
              || new mongoose.Types.ObjectId(),
          },
          update: {
            $set: {
              value: data.value,
            },
          },
        },
      }));
      await paymentGateway.bulkWrite(operations);
    } else {
      await paymentGateway.updateOne(
        {
          site: paymentName,
          name: "is_enabled",
        },
        {
          $set: {
            value: is_enabled,
          },
        }
      );
    }

    // finish transcation
    await session.commitTransaction();
    session.endSession();
    res.status(httpStatus.OK);
    res.json({
      message: `Payment gateway ${req.params.site} updated successfully.`,
      status: true,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw new APIError(error);
  }
};
