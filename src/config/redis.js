const Redis = require('ioredis');
const vars = require('./vars');

const redisHost = vars.redisHost || "redis";
const redisPort = vars.redisPort || 6379;
const redisPassword = vars.redisPassword || "";

const connection = new Redis({
  host: redisHost,
  port: redisPort,
  password: redisPassword || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  family: 4, // force IPv4
});

module.exports = { connection };
