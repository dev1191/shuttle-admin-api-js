const mongoose = require("mongoose");
const httpStatus = require("http-status");
const mongoosePaginate = require("mongoose-paginate-v2");
const moment = require("moment-timezone");

const SeatListSchema = new mongoose.Schema({
  id: { type: Number, index: true },
  col: { type: Number, index: true },
  row: { type: Number, index: true },
  deck: { type: Number, index: true },
  name: { type: String, index: true },
  isSeat: { type: Boolean, index: true },
  isGap: { type: Boolean, index: true },
  isFemale: { type: Boolean, index: true },
});
/**
 * Bus layout Schema
 * @private
 */
const busLayoutSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
    },
    max_seats: {
      type: String,
      index: true,
      default: "",
    },
    seat_lists: {
      type: [SeatListSchema],
      index: true,
      default: "",
    },
    rows: { type: Number, default: 0, index: true },
    columns: { type: Number, default: 0, index: true },
    steering: {
      type: String,
      enum: ["left", "right"],
      default: "left",
    },
    status: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

busLayoutSchema.method({
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "name",
      "max_seats",
      "seat_lists",
      "steering",
      "rows",
      "columns",
      "status",
    ];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

busLayoutSchema.statics = {
  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<User[]>}
   */
  transformOptions(data) {
    const selectableItems = [];
    const i = 1;
    data.forEach((item) => {
      selectableItems.push({
        value: item._id,
        text: item.name + " - " + this.layoutName(item.layout),
      });
    });
    return selectableItems;
  },
  transformData(data) {
    const selectableItems = [];
    let i = 1;
    data.forEach((item) => {
      selectableItems.push({
        id: i++,
        ids: item.id,
        max_seats: item.max_seats,
        layout: this.layoutName(item.layout),
        last_seat: item.last_seat,
        seat_numbers: item.seat_numbers,
        combine_seats: item.combine_seats,
        name: item.name,
        status: item.status,
        createdAt: moment
          .utc(item.createdAt)
          .tz(DEFAULT_TIMEZONE)
          .format("DD MMM YYYY"),
      });
    });
    return selectableItems;
  },
  layoutName(name) {
    if (name == "layout-1") {
      return "1 X 1";
    }
    if (name == "layout-2") {
      return "1 X 2";
    }
    if (name == "layout-3") {
      return "2 X 1";
    }
    if (name == "layout-4") {
      return "2 X 2";
    }
    if (name == "layout-5") {
      return "2 X 3";
    }
    if (name == "layout-6") {
      return "3 X 2";
    }
  },
};

busLayoutSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Bus_Layout", busLayoutSchema);
