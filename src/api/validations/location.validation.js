const Joi = require("joi");
const { objectId } = require("./custom.validation");

const listLocations = {
  query: Joi.object()
    .keys({
      search: Joi.string().allow(null, ""),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      status: Joi.boolean(),
    })
    .unknown(),
};

const createLocation = {
  body: Joi.object().keys({
    title: Joi.string().required(),
    lat: Joi.number(),
    lng: Joi.number(),
    landmark: Joi.string(),
    type: Joi.optional(),
    status: Joi.boolean(),
  }),
};

const replaceLocation = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().required(),
      lat: Joi.number(),
      type: Joi.optional(),
      lng: Joi.number(),
      landmark: Joi.string(),
      status: Joi.boolean(),
    })
    .min(1),
};

const updateLocation = {
  params: Joi.object().keys({
    locationId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      title: Joi.string().required(),
      lat: Joi.number(),
      type: Joi.optional(),
      lng: Joi.number(),
      landmark: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown()
    .min(1),
};

const deleteLocation = {
  params: Joi.object().keys({
    locationId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  // GET /v1/locations
  listLocations,
  // POST /v1/locations
  createLocation,
  // PUT /v1/locations/:locationId
  replaceLocation,
  // PATCH /v1/locations/:locationId
  updateLocation,
  deleteLocation,
};
