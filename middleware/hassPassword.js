const bcrypt = require("bcrypt");

const hashPassword = async (req, res, next) => {
  try {
    const saltRounds = 10;
    if (!req.body.password) {
      return res
        .status(400)
        .json({ success: false, error: "Password is required" });
    }
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    req.body.password = hashedPassword;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw error;
  }
};

module.exports = { hashPassword, comparePassword };
