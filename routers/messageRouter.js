const express = require("express");
const mongoose = require("mongoose");
const { authMiddleware } = require("../middleware/authMiddleware");
const { verifyToken } = require("../lib/jwtTokrn");
const MessageModel = require("../schema/messgae.model");
const { getUserRoom } = require("../utils/socketRoom");

const router = express.Router();

// const getUserRoom = (userId) => `user:${String(userId)}`;

const getTokenFromHandshake = (socket) => {
  const authHeader = socket.handshake.headers?.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (bearerToken) return bearerToken;
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;

  const cookieHeader = socket.handshake.headers?.cookie;
  if (!cookieHeader) return null;
  const tokenCookie = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith("token="));

  return tokenCookie
    ? decodeURIComponent(tokenCookie.replace("token=", ""))
    : null;
};

const createAndEmitMessage = async ({
  io,
  senderId,
  receiverId,
  content,
  messageType = "text",
}) => {
  const savedMessage = await MessageModel.create({
    sender: senderId,
    receiver: receiverId,
    content,
    messageType,
  });

  const populatedMessage = await MessageModel.findById(savedMessage._id)
    .populate("sender", "_id name username image.profile")
    .populate("receiver", "_id name username image.profile");

  io.to(getUserRoom(senderId))
    .to(getUserRoom(receiverId))
    .emit("message:received", {
      success: true,
      data: populatedMessage,
    });

  return populatedMessage;
};

router.post("/send", authMiddleware, async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, messageType } = req.body;

    if (!receiverId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: "receiverId and content are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid receiverId" });
    }

    const io = req.app.get("io");
    const message = await createAndEmitMessage({
      io,
      senderId,
      receiverId,
      content: content.trim(),
      messageType,
    });

    return res.status(201).json({
      success: true,
      data: message,
      message: "Message sent successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/conversation/:friendId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid friendId" });
    }

    const messages = await MessageModel.find({
      $or: [
        { sender: userId, receiver: friendId },
        { sender: friendId, receiver: userId },
      ],
      deletedFor: { $ne: userId },
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "_id name username image.profile")
      .populate("receiver", "_id name username image.profile");

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
      message: "Conversation fetched successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.patch("/read/:friendId", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { friendId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid friendId" });
    }

    const result = await MessageModel.updateMany(
      {
        sender: friendId,
        receiver: userId,
        isRead: false,
      },
      { $set: { isRead: true } },
    );

    const io = req.app.get("io");
    io.to(getUserRoom(friendId)).to(getUserRoom(userId)).emit("message:read", {
      success: true,
      by: userId,
      with: friendId,
    });

    return res.status(200).json({
      success: true,
      modifiedCount: result.modifiedCount,
      message: "Messages marked as read",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

const registerMessageSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromHandshake(socket);
      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = await verifyToken(token);
      if (!decoded?.id) {
        return next(new Error("Unauthorized"));
      }

      socket.userId = decoded.id;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    socket.join(getUserRoom(userId));

    socket.emit("socket:ready", {
      success: true,
      userId,
    });

    socket.on("message:send", async (payload = {}, callback) => {
      try {
        const { receiverId, content, messageType } = payload;

        if (!receiverId || !content?.trim()) {
          throw new Error("receiverId and content are required");
        }

        if (!mongoose.Types.ObjectId.isValid(receiverId)) {
          throw new Error("Invalid receiverId");
        }

        const createdMessage = await createAndEmitMessage({
          io,
          senderId: userId,
          receiverId,
          content: content.trim(),
          messageType,
        });

        if (typeof callback === "function") {
          callback({ success: true, data: createdMessage });
        }
      } catch (error) {
        if (typeof callback === "function") {
          callback({ success: false, message: error.message });
        }
      }
    });

    socket.on("message:typing", ({ receiverId, isTyping }) => {
      if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
        return;
      }

      io.to(getUserRoom(receiverId)).emit("message:typing", {
        from: userId,
        isTyping: Boolean(isTyping),
      });
    });
  });
};

module.exports = {
  messageRouter: router,
  registerMessageSocket,
};
