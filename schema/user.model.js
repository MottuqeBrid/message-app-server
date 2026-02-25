const mongoose = require("mongoose");

const UserModel = mongoose.model("User", {
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
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
        max: 100,},
    gender: {
        type: String,
        enum: ["male", "female"],
        },
    phone: {
        type: String,
        unique: true,
    },
    
},{timestamps: true});

module.exports = UserModel;