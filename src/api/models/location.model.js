const mongoose = require("mongoose");
const { omitBy, isNil } = require("lodash");
const mongoosePaginate = require("mongoose-paginate-v2");
const objectIdToTimestamp = require("objectid-to-timestamp");


/**
 * Location Schema
 * @private
 */
const locationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      index: true,
      trim: true,
      default: "",
    },
    landmark:{ type: String, default: "",index:true },
    integer_id:{type:Number,default:1,unique:true},
    type: { type: String, default: "" },
    location: {
      type: { type: String, default: "Point" },
      address: { type: String, default: "" },
      coordinates: [Number, Number],
    },
    status: { type: Boolean, default: false },
    files:{type:[String],default:null}
  },
  {
    timestamps: true,
  }
);

locationSchema.index("location");

/**
 * Methods
 */
locationSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "title",
      "landmark",
      "location",
      "status",
      "createdAt",
      "updatedAt",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

locationSchema.statics = {
  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  list({ page = 1, perPage = 30, title, location, city, state, status }) {
    const options = omitBy(
      {
        title,
        location,
        city,
        state,
        status,
      },
      isNil
    );

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },
  transformLoad(rows) {
    const selectableItems = [];
    rows.forEach((item) => {
      selectableItems.push({
        id:item._id,
        title: item.title,
        address: item.location.address,
        position: {
          lat: item.location.coordinates[1],
          lng: item.location.coordinates[0],
        },
        lat: item.location.coordinates[1],
        lng: item.location.coordinates[0],
        type: item.type,
        status: item.status,
      });
    });
    return selectableItems;
  },
  transformData(item) {
    return {
      id: item._id,
      integer_id:item.integer_id,
      title: item.title,
      landmark: item.landmark,
      type: item.type,
      address: item.location.address,
      lat: item.location.coordinates[1],
      lng: item.location.coordinates[0],
      status: item.status,
      files:item.files ?? [],
    };
  },
  formatLocation(data) {
    const selectableItems = [];
    data.forEach((item) => {
      selectableItems.push({
        id: item._id,
        pageid: objectIdToTimestamp(item._id),
        title: item.title,
        landmark: item.landmark,
        address:item.location.address,
        coordinates:item.location.coordinates
      });
    });
    return selectableItems;
  },
  transformDataLists(data) {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item.id,
        integer_id:item.integer_id,
        title: item.title,
        landmark: item.landmark,
        type: item.type,
        location_address: item.location.address,
        location_lat: item.location.coordinates[1],
        location_lng: item.location.coordinates[0],
        status: item.status,
        createdAt: item.createdAt,
      });
    });
    return selectableItems;
  },
};

locationSchema.plugin(mongoosePaginate);

/**
 * @typedef Location
 */
module.exports = mongoose.model("Location", locationSchema);
