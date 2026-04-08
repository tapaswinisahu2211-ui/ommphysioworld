const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ommphysio"
  );
  console.log("MongoDB Connected");
};

module.exports = connectDB;
