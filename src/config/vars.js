const path = require("path");

// import .env variables
require("dotenv-safe").config({
  allowEmptyValues: true,
});


//console.log("FULLBASEURL", `${JSON.stringify(process.env)}`);
module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT,
  BASEURL: process.env.BASE_URL,
  FULLBASEURL: process.env.FULL_BASEURL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  awsEndPoint:process.env.AWS_ENDPOINT,
  awsDefaultRegion:process.env.AWS_DEFAULT_REGION,
  awsAccessKey:process.env.SPACES_KEY,
  awsSecretKey:process.env.SPACES_SECRET,
  awsBucketName:process.env.AWS_S3_BUCKET,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisPassword: process.env.REDIS_PASSWORD,
  mongo: {
    host:process.env.MONGO_HOST,
    username:process.env.MONGO_USERNAME,
    password:process.env.MONGO_PASSWORD,
    db:process.env.MONGO_DB,
    rs:process.env.MONGO_RS,
    uri:
      process.env.NODE_ENV === "test"
        ? process.env.MONGO_URI_TESTS
        : process.env.MONGO_URI,
  },
  logs: process.env.NODE_ENV === "production" ? "combined" : "dev",
};
