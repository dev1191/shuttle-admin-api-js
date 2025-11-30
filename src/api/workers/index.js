// import .env variables
require("dotenv-safe").config({
  allowEmptyValues: true,
});

const mongoose = require("../../config/mongoose"); // your mongoose connection helper
const { notificationWorker } = require("./notification.worker");

(async () => {
  try {
    // 1️⃣ Connect to MongoDB first
    await mongoose.connect();

    // 2️⃣ Start workers
    console.log("📡 All workers started...");

    // 3️⃣ Global error handling
    [notificationWorker].forEach((worker) => {
      worker.on("error", (err) => {
        console.error(`Worker ${worker.name || "unknown"} error:`, err);
      });

      worker.on("completed", ({ jobId }) => {
        console.log(`✅ Worker ${worker.name || "unknown"} job ${jobId} completed`);
      });

      worker.on("failed", ({ jobId, failedReason }) => {
        console.error(`❌ Worker ${worker.name || "unknown"} job ${jobId} failed:`, failedReason);
      });
    });
  } catch (err) {
    console.error("❌ Failed to start workers:", err);
    process.exit(1);
  }
})();
