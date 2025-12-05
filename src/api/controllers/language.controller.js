const httpStatus = require("http-status");
const { omit, isEmpty } = require("lodash");
const Language = require("../models/language.model");
const APIError = require("../utils/APIError");

exports.fetchLanguage = async (req, res, next) => {
  try {
    let condition = req.query.search != ""
        ? {
            label: {
              $regex: `(\s+${req.query.search}|^${req.query.search})`,
              $options: "i",
            },
            status: true,
          }
        : {
            status: true,
          };

    const getLanguages = await Language.aggregate([
      { $match: condition },
      {
        $project: {
          _id: 0,
          label: { $concat: ["$label", "(", "$code", ")"] },
          value: "$code",
        },
      },
      {
        $sort: { label: -1 },
      },
    ]);
    res.json({ items: getLanguages });
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Get language
 * @public
 */
exports.get = async (req, res, next) => {
  try {
    const language = await Language.findById(req.params.languageId);
    res.status(httpStatus.OK);
    res.json({
      message: "language get successfully.",
      data: language.transform(),
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

    // Check if language with same code already exists
    const existingLanguage = await Language.findOne({
      $or: [
        { code: code.toUpperCase() },
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
      ],
    });

    if (existingLanguage) {
      return res.status(httpStatus.CONFLICT).json({
        status: false,
        message: "Language with this code or name already exists",
        data: null,
      });
    }

    const language = await new Language({
      name,
      code: code.toUpperCase(), // Store code in uppercase for consistency
      symbol,
      status,
    }).save();

    return res.status(http).json({
      status: true,
      message: "Language created successfully",
      data: language,
    });
  } catch (error) {
    console.log(error);

    // Handle MongoDB duplicate key error (if you have unique index)
    if (error.code === 11000) {
      return res.status(httpStatus.CONFLICT).json({
        status: false,
        message: "Language with this code already exists",
        data: null,
      });
    }

    next(new APIError(error));
  }
};

/**
 * Update existing language
 * @public
 */

exports.update = async (req, res, next) => {
  try {
    const { name, code, symbol, status } = req.body;
    const languageexists = await Language.findById(
      req.params.languageId
    ).exec();
    if (languageexists) {
      /**  if (status) { // check is status is true
        const getLanguageStatus = await Language.find({ status });
        const LanguageIds = getLanguageStatus.filter(v => v._id);
        await Language.updateMany({ _id: { $in: LanguageIds } }, { status: false });
      }  */

      const objUpdate = {
        name,
        code,
        symbol,
        status,
      };

      const updateLanguage = await Language.findByIdAndUpdate(
        req.params.languageId,
        {
          $set: objUpdate,
        },
        {
          new: true,
        }
      );
      if (updateLanguage) {
        res.status(httpStatus.CREATED);
        return res.json({
          status: true,
          message: "Language updated successfully",
          data: updateLanguage,
        });
      }
    } else {
      res.status(httpStatus.OK);
      res.json({
        status: true,
        message: "No language found.",
      });
    }
  } catch (error) {
    console.log(error);
    throw new APIError(error);
  }
};

/**
 * Get language list
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
      populate: [{ path: "countryId", select: "name" }],
      sort,
    };

    const result = await Language.paginate(condition, paginationoptions);
    result.items = Language.transformData(result.items);

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
  Language.updateOne(
    {
      _id: req.params.languageId,
    },
    {
      $set: { is_deleted: true },
    }
  )
    .then(() => {
      res.status(httpStatus.OK).json({
        status: true,
        message: "Language deleted successfully.",
      });
    })
    .catch((e) => next(e));
};
