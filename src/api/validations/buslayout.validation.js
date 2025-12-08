const Joi = require("joi");
const { objectId } = require("./custom.validation");

const listBusLayouts = {
  query: Joi.object()
    .keys({
      search: Joi.string().allow(null, ""),
      page: Joi.number().min(1),
      limit: Joi.number().min(1).max(100),
      name: Joi.string(),
      status: Joi.boolean(),
    })
    .unknown(),
};

const createBusLayouts = {
  body: Joi.object().keys({
    name: Joi.string(),
    status: Joi.boolean(),
    max_seats: Joi.string(),
    seat_lists: Joi.array().items(
      Joi.object().keys({
        id: Joi.number(),
        col: Joi.number(),
        row: Joi.number(),
        deck: Joi.number(),
        name: Joi.string(),
        isSeat: Joi.boolean(),
        isGap: Joi.boolean(),
        isFemale: Joi.boolean(),
      })
    ),
    steering: Joi.string().valid("left", "right"),
    rows: Joi.number(),
    columns: Joi.number(),
  }),
};

const replaceBusLayouts = {
  params: Joi.object().keys({
    buslayoutId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    status: Joi.boolean(),
    max_seats: Joi.string(),
    seat_lists: Joi.array().items(
      Joi.object().keys({
        id: Joi.number(),
        col: Joi.number(),
        row: Joi.number(),
        deck: Joi.number(),
        name: Joi.string(),
        isSeat: Joi.boolean(),
        isGap: Joi.boolean(),
        isFemale: Joi.boolean(),
      })
    ),
    steering: Joi.string().valid("left", "right"),
    rows: Joi.number(),
    columns: Joi.number(),
  }),
};

const updateBusLayouts = {
  params: Joi.object().keys({
    buslayoutId: Joi.string().custom(objectId),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    status: Joi.boolean(),
    max_seats: Joi.string(),
    seat_lists: Joi.array().items(
      Joi.object().keys({
        id: Joi.number(),
        col: Joi.number(),
        row: Joi.number(),
        deck: Joi.number(),
        name: Joi.string(),
        isSeat: Joi.boolean(),
        isGap: Joi.boolean(),
        isFemale: Joi.boolean(),
      })
    ),
    steering: Joi.string().valid("left", "right"),
    rows: Joi.number(),
    columns: Joi.number(),
  }),
};

const deleteBusLayouts = {
  params: Joi.object().keys({
    buslayoutId: Joi.string().custom(objectId),
  }),
};

module.exports = {
  // GET /v1/buslayouts
  listBusLayouts,
  replaceBusLayouts,
  // POST /v1/buslayouts
  createBusLayouts,
  // PATCH /v1/buslayouts/:buslayoutId
  updateBusLayouts,
  deleteBusLayouts,
};
