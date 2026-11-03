const mongoose = require("mongoose");

// اتصال کش می‌شود تا در Serverless هر درخواست اتصال جدید نسازد
let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) throw new Error("MONGODB_URI is not defined in environment variables");

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri, { bufferCommands: false })
      .then((m) => {
        console.log(`MongoDB Connected: ${m.connection.host}`);
      })
      .catch((error) => {
        connectionPromise = null; // درخواست بعدی دوباره تلاش می‌کند
        console.error("Failed to connect to MongoDB:", error.message);
        throw error;
      });
  }

  await connectionPromise;
};

module.exports = connectDB;
