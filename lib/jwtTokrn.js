const createToken = async (user) => {
  const token = jwt.sign({ id: user._id }, process.env.SECRET_KEY);
  return token;
};

const verifyToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    return decoded;
  } catch (error) {
    return null;
  }
};

module.exports = { createToken, verifyToken };
