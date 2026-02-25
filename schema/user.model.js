const mongoose = require("mongoose");

const UserModel = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      trim: true,
    },
    username: {
      type: String,
      unique: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 100,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    phone: {
      type: String,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserModel);
