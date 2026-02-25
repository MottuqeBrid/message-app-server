const express = require("express");
const { hashPassword, comparePassword } = require("../middleware/hassPassword");
const UserModel = require("../schema/user.model");
const { createToken } = require("../lib/jwtTokrn");
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

    const token = createToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });
    res
      .status(200)
      .json({ success: true, data: user, message: "Login successful" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post("/register", hashPassword, async (req, res) => {
  console.log("came here");
  try {
    const { email, username } = req.body;

    const existingUser = await UserModel.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, error: "User already exists" });
    }
    const existingUserByUsername = await UserModel.findOne({ username });
    if (existingUserByUsername) {
      return res
        .status(400)
        .json({ success: false, error: "Username already exists" });
    }

    const user = await UserModel.create(req.body);
    const token = createToken(user);
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
    res.status(200).json({
      success: true,
      message: "User registered successfully",
      data: user,
      token: token,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
router.get("/user", async (req, res) => {
  try {
    const { email } = req.query;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, error: "User not found" });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
