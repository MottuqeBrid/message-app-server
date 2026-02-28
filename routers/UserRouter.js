const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const userModel = require("../schema/user.model");
const route = express.Router();

route.get("/profile", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    console.log(id);
    const user = await userModel.findById(id);

    console.log(user);
    res.status(200).json({
      success: true,
      data: user,
      message: "User profile fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching user profile",
    });
  }
});
route.patch("/profile", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const { password, email, ...data } = req.body;
    const user = await userModel.findByIdAndUpdate(id, data, { new: true });
    res.status(200).json({
      success: true,
      data: user,
      message: "User profile updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating user profile",
    });
  }
});

module.exports = route;
