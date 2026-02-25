const { verifyToken } = require("../lib/jwtTokrn");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(401).json({ success: false, error: "Invalid token" });
    }
    req.user = decoded;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { authMiddleware };
