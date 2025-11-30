const { Worker, QueueEvents, JobsOptions } = require("bullmq");
const { connection } = require("../../config/redis");


const concurrency = Number(process.env.CONCURRENCY || 5);

const notificationWorker = new Worker(
  "sms",
  async (job) => {
    if (job.name === "send-notification") {
      const payload = job.data;

      try {

        job.updateProgress(100);
        job.log(`✅ notification sent to ${payload.userId}`);
        return { ok: true };
      } catch (err) {
        job.log(`❌ Failed to send notification to ${payload.userId}: ${err.message}`);
        throw err; // triggers BullMQ retry
      }
    }
  },
  { connection, concurrency }
);

// Queue event listeners
const notificationEvents = new QueueEvents("notification", { connection });

notificationEvents.on("completed", ({ jobId }) => {
  console.log(`✅ notification job ${jobId} completed`);
});

notificationEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`❌ notification job ${jobId} failed: ${failedReason}`);
});

module.exports = { notificationWorker, notificationEvents };