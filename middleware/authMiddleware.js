const { verifyToken } = require("../lib/jwtTokrn");

// const decodedToken = (token) => {
//   const decoded = jwt.verify(token, process.env.SECRET_KEY);
//   return decoded;
// };

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      token = req.cookies.token;
    }
    if (!token) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    const decoded = await verifyToken(token);
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
