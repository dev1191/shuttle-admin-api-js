const { S3Client } = require("@aws-sdk/client-s3");
const { awsAccessKey,awsDefaultRegion,awsEndPoint,awsSecretKey } = require("./vars");


// Create an s3 instance
const s3Client = new S3Client({
  forcePathStyle: false, // Configures to use subdomain/virtual calling format.
  endpoint: awsEndPoint,
  region: awsDefaultRegion, //"us-east-1",
  credentials: {
    accessKeyId:awsAccessKey,
    secretAccessKey: awsSecretKey,
  },
});


module.exports = { s3Client };
