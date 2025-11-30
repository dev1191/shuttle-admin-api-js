const Joi = require("joi");

const listSuggests = {
  query: Joi.object().keys({
    search:Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    limit: Joi.number().min(1).max(100),
    name: Joi.string(),
  }).unknown()
};

module.exports = {
  // GET /v1/suggests
  listSuggests,
};
