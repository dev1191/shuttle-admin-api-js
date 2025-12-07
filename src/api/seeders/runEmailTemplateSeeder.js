/**
 * Seeder Script for Email Templates
 * Run this script to seed email templates into the database
 *
 * Usage: node src/api/seeders/runEmailTemplateSeeder.js
 */

const mongoose = require("mongoose");
const { seedEmailTemplates } = require("./emailTemplate.seeder");

// Load environment variables
require("dotenv-safe").config();

const { MONGO_URI } = process.env;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

/**
 * Run seeder
 */
const runSeeder = async () => {
  try {
    console.log("Starting email template seeder...\n");

    await connectDB();

    const result = await seedEmailTemplates();

    console.log(`\n✅ Successfully seeded ${result.count} email templates`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeder error:", error);
    process.exit(1);
  }
};

// Run the seeder
runSeeder();
