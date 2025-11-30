const httpStatus = require('http-status');
const {
  omit, isEmpty,
} = require('lodash');
const BusType = require('../models/busType.model');
const Bus = require("../models/bus.model");

/**
 * Load user and append to req.
 * @public
 */
 exports.load = async (req, res, next) => {
  try {
    const bustype = await BusType.find({status:true});
    res.status(httpStatus.OK);
    res.json({
      message: 'Bus Type load data.',
      data: BusType.transformOptions(bustype),
      status: true,
    });
  } catch (error) {
    return next(error);
  }
};


/**
 * Get bus type
 * @public
 */
 exports.get = async (req, res) => {
  try {
    const bustype = await BusType.findById(req.params.bustypeId);
    res.status(httpStatus.OK);
    res.json({
      message: 'Bus Type successfully.',
      data: bustype.transform(),
      status: true,
    });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};


/**
 * Create new bus type
 * @public
 */
exports.create = async (req, res, next) => {
  try {
    const { name, status } = req.body;

    // Check if BusType with same code already exists
    const existingBusType = await BusType.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name}$`, "i") } },
      ],
    });

    if (existingBusType) {
      return res.status(409).json({
        status: false,
        message: "BusType with this code or name already exists",
        data: null,
      });
    }

    const newBusType = await new BusType({
      name,
      status,
    }).save();

    return res.status(201).json({
      status: true,
      message: "BusType created successfully",
      data: newBusType,
    });
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(409).json({
        status: false,
        message: "BusType with this code already exists",
        data: null,
      });
    }

    next(new APIError(error));
  }
};




/**
 * Get bsu layout list
 * @public
 */
 exports.list = async (req, res, next) => {
  try {
    const condition = req.query.search
    ? {
      $or: [
        { name: { $regex: new RegExp(req.query.search), $options: 'i' } },
        { status: req.query.search != 'inactive'},
      ],
    }
    : {};

    let sort = {};
    if (req.query.sortBy != '' && req.query.sortDesc != '') {
      sort = { [req.query.sortBy]: req.query.sortDesc === "desc" ? -1 : 1 };
    } 


  const paginationoptions = {
    page: req.query.page || 1,
    limit: req.query.limit || 10,
    collation: { locale: 'en' },
    customLabels: {
      totalDocs: 'totalRecords',
      docs: 'items',
    },
    sort,
    lean: true,
  };

  const result = await BusType.paginate(condition, paginationoptions);
  result.items = BusType.transformData(result.items)
  res.json(result);

  }catch(error){
    next(error);
  }
}




/**
 * Update existing bus type
 * @public
 */
 exports.update =async (req, res, next) => {
  try {
	  
    const updatebustype = await BusType.findByIdAndUpdate(req.params.bustypeId,{
      $set: {
        name: req.body.name,
        status: req.body.status,
      },
    }, {
      new: true,
    });
    const transformedBusType = updatebustype.transform();
    res.json({ message: 'Bus type updated successfully.', bustype:transformedBusType,status:true});
  } catch (error) {
    next(error);
  }
};


/**
 * Delete bus type
 * @public
 */
exports.remove = (req, res, next) => {
  Bus.findOne({ bustypeId: req.params.bustypeId }).then((result) => {
    if (result) {
      res.status(httpStatus.OK).json({
        status: false,
        message: `Please delete bus name ${result.name} first.`,
      });
    } else {
      BusType.deleteOne({
        _id: req.params.bustypeId,
      })
        .then(() => res.status(httpStatus.OK).json({
            status: true,
            message: "Bus type deleted successfully.",
          })
        )
        .catch((e) => next(e));
    }
  }).catch((e) => next(e));
};
