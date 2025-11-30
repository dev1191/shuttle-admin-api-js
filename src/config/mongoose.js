const mongoose = require("mongoose");
const logger = require("./logger");
const { mongo, env } = require("./vars");

const { host, username, password, db: database, rs, uri } = mongo;

const mongoDBURL = uri || `mongodb+srv://${username}:${encodeURIComponent(password)}@${host}/${database}?authSource=admin&replicaSet=${rs}`;

mongoose.Promise = Promise;
mongoose.set("strictQuery", true);
mongoose.set("debug", env === "development");

mongoose.connection.on("error", (err) => {
  logger.error(`MongoDB connection error: ${err}`);
  process.exit(-1);
});

exports.connect = async () => {
  try {
    await mongoose.connect(mongoDBURL);
    console.log("MongoDB connected...");
    return mongoose.connection;
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    process.exit(-1);
  }
};
