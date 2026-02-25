const express = require("express");
const { hashPassword, comparePassword } = require("../middleware/hassPassword");
const UserModel = require("../schema/user.model");
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password, username } = req.body;
    let user;
    if (!username && email) {
      const user = await UserModel.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ success: false, error: "User not found" });
      }
    } else if (!email && username) {
      const userByUsername = await UserModel.findOne({ username });
      if (!userByUsername) {
        return res
          .status(400)
          .json({ success: false, error: "User not found" });
      }
      user = userByUsername;
    } else {
      return res
        .status(400)
        .json({ success: false, error: "Email or username is required" });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid credentials" });
    }
    res
      .status(200)
      .json({ success: true, data: user, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/register", hashPassword, async (req, res) => {
  try {
    const { email, username } = req.body;
    exestingUser = await UserModel.findOne({ email });
    if (exestingUser) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }
    exestingUser = await UserModel.findOne({ username });
    if (exestingUser) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }
    const user = await UserModel.create(req.body);
    res
      .status(200)
      .json({
        success: true,
        message: "User registered successfully",
        data: user,
      });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
