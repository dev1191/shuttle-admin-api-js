const Joi = require("joi");
const { objectId } = require("./custom.validation");

const list = {
  query: Joi.object()
    .keys({
      search: Joi.string().allow(null, ""),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      label: Joi.string(),
      code: Joi.string(),
      country_name: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown(),
};

const create = {
  body: Joi.object()
    .keys({
      label: Joi.string(),
      code: Joi.string(),
      country_name: Joi.string(),
      countryId: Joi.string().custom(objectId),
      status: Joi.boolean(),
    })
    .unknown(),
};

const get = {
  params: Joi.object().keys({
    languageId: Joi.string().custom(objectId),
  }),
};
const remove = {
  params: Joi.object().keys({
    languageId: Joi.string().custom(objectId),
  }),
};

const update = {
  params: Joi.object().keys({
    languageId: Joi.required().custom(objectId),
  }),
  body: Joi.object()
    .keys({
      label: Joi.string(),
      code: Joi.string(),
      country_name: Joi.string(),
      countryId: Joi.string().custom(objectId),
      status: Joi.boolean(),
    })
    .unknown()
    .min(1),
};

module.exports = {
  // GET /v1/route
  list,
  get,
  // POST /v1/route
  create,
  // PATCH /v1/route/:routeId
  update,
  remove,
};
