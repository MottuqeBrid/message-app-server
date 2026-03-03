const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const userModel = require("../schema/user.model");
const route = express.Router();

route.get("/profile", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await userModel.findById(id);
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

route.patch("/update-active", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const { isActive } = req.body;
    const user = await userModel.findByIdAndUpdate(
      id,
      { isActive, active: isActive },
      { new: true },
    );
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

const userSocket = (io, socket) => {
  socket.on("user:updateActive", async ({ userId, isActive } = {}) => {
    try {
      const user = await userModel.findByIdAndUpdate(
        userId,
        { isActive, active: isActive },
        { new: true },
      );
      io.to(getUserRoom(userId)).emit("user:activeUpdated", {
        success: true,
        data: user,
        message: "User active status updated successfully",
      });
    } catch (error) {
      io.to(getUserRoom(userId)).emit("user:activeUpdated", {
        success: false,
        message: "Error updating user active status",
      });
    }
  });
};

module.exports = route;
