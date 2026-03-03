// sockets/user.socket.js

const userModel = require("../schema/user.model");
const { getUserRoom } = require("./socketRoom");

const userSocket = (io, socket) => {
  const setUserActiveState = async (userId, isActive) => {
    if (!userId) return;
    console.log(userId);

    await userModel.findByIdAndUpdate(userId, { isActive, active: isActive });

    io.emit("user:statusChanged", {
      userId,
      isActive,
    });
  };

  if (socket.userId) {
    socket.join(getUserRoom(socket.userId));
    setUserActiveState(socket.userId, true).catch((error) => {
      console.error("Failed to set active state:", error.message);
    });
  }

  // join personal room
  socket.on("user:join", async ({ userId } = {}) => {
    const targetUserId = socket.userId || userId;
    if (!targetUserId) return;

    socket.userId = targetUserId;
    socket.join(getUserRoom(targetUserId));

    await setUserActiveState(targetUserId, true);
  });

  // auto offline on disconnect
  socket.on("disconnect", async () => {
    if (socket.userId) {
      await setUserActiveState(socket.userId, false);
    }
  });

  // manual update (optional)
  socket.on("user:updateActive", async ({ userId, isActive } = {}) => {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { isActive, active: isActive },
      { new: true },
    );

    io.to(getUserRoom(userId)).emit("user:activeUpdated", {
      success: true,
      data: user,
    });
  });
};

module.exports = userSocket;
