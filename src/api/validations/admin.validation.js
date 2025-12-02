
const Joi = require("joi");


const listAdmin = {
  query: Joi.object().keys({
    search:Joi.string().allow(null, ''),
    page: Joi.number().min(1),
    limit: Joi.number().min(1).max(100),
    status: Joi.boolean(),
    sortBy: Joi.string(),
    sortDesc:Joi.string()
  }).unknown()
};


module.exports = {
  // GET /v1/Admin
  listAdmin,

}