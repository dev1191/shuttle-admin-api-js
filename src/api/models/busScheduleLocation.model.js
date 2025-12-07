const mongoose = require("mongoose");
const { omitBy, isNil } = require("lodash");
const paginateAggregate = require("mongoose-aggregate-paginate-v2");
const { timeToMinutes } = require('../utils/time')
const { Schema } = mongoose;
const { ObjectId } = Schema;

const BusScheduleLocationSchema = new Schema(
  {
    busScheduleId: { type: ObjectId, ref: "Bus_Schedule", required: true },
    stopId: { type: ObjectId, ref: "Location", required: true },
    departure_time: { type: Number, default: "", index: true },
    arrival_time: { type: Number, default: "", index: true },
    order: { type: Number, default: 1, index: true },
  },
  { timestamps: true }
);

BusScheduleLocationSchema.statics = {
  async createOrUpdate(scheduleId, stops, session) {
    try {
      if (!Array.isArray(stops) || stops.length === 0) return;

      const ops = stops.map((s) => {
        const updateData = {
          busScheduleId: scheduleId,
          stopId: s.stopId,
          order: s.order,
          // arrival_time and departure_time can be provided as "HH:MM" strings or as minutes
          arrival_time: timeToMinutes(s.arrival_time),
          departure_time: timeToMinutes(s.departure_time),
        };

        return this.updateOne(
          { busScheduleId: scheduleId, stopId: s.stopId },
          { $set: updateData },
          { upsert: true, session }
        );
      });

      await Promise.all(ops);
    } catch (err) {
      console.log(err);
      throw err;
    }
  },
};


BusScheduleLocationSchema.plugin(paginateAggregate);

module.exports = mongoose.model(
  "Bus_Schedule_Location",
  BusScheduleLocationSchema
);
