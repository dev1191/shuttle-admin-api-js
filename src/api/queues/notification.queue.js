const { Queue } = require("bullmq");
const { connection } = require("../../config/redis");

const notificationQueue = new Queue("sms", { connection });

// enqueue helper
async function enqueueSendNotification(payload) {
  payload.timestamp = Date.now(); // add timestamp to payload
  await notificationQueue.add("send-sms", payload, {
    attempts: 5, // retries
    backoff: { type: "exponential", delay: 1000 }, // 1s, 2s, 4s, ...
    removeOnComplete: { age: 24 * 60 * 60 * 1000, count: 10000 },
    removeOnFail: { age: 7 * 24 * 60 * 60 * 1000, count: 10000 },
    jobId: `notification:${payload.userId}:${payload.timestamp}`,
    timeout: 30000,
    priority: 2,
  });
}

module.exports = { notificationQueue, enqueueSendNotification };