const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const userModel = require("../schema/user.model");
const route = express.Router();

route.get("/all", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const user = await userModel
      .findById(id)
      .populate("friends")
      .populate("requests");

    const suggestions = await userModel.find({
      _id: {
        $nin: [
          ...user.friends,
          user._id,
          ...user.requestsSend,
          ...user.requests,
        ],
      },
    });

    return res.status(200).json({
      success: true,
      data: user,
      friends: user.friends,
      requests: user.requests,
      suggestions: suggestions,
      message: "All friends fetched successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error fetching friends", error });
  }
});

route.patch("/request/:id", authMiddleware, async (req, res) => {
  try {
    const id = req.user.id;
    const friendId = req.params.id;
    const user = await userModel.findById(id);
    const friend = await userModel.findById(friendId);

    // Check if the user and friend exist
    if (!user || !friend) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    // Check if a friend request has already been sent
    if (friend.requests?.includes(id)) {
      return res
        .status(400)
        .json({ success: false, message: "Friend request already sent" });
    }
    if (user.requestsSend?.includes(friendId)) {
      return res
        .status(400)
        .json({ success: false, message: "Friend request already sent" });
    }

    if (user.friends.includes(friendId)) {
      return res
        .status(400)
        .json({ success: false, message: "Already friends" });
    }

    // Add the friend request to the user's requestsSend and the friend's requests
    await userModel.findByIdAndUpdate(
      id,
      { $push: { requestsSend: friendId } },
      { new: true },
    );
    await userModel.findByIdAndUpdate(
      friendId,
      { $push: { requests: id } },
      { new: true },
    );
    return res
      .status(200)
      .json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error sending friend request", error });
  }
});

route.patch("/action/:id", authMiddleware, async (req, res) => {
  try {
    const { action } = req.query; // "accept" or "reject"
    const id = req.user.id;
    const friendId = req.params.id;
    const user = await userModel.findById(id);
    const friend = await userModel.findById(friendId);

    // Check if the user and friend exist
    if (!user || !friend) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (action === "accept") {
      // Check if the user has a pending friend request from the friend
      if (!user.requests.includes(friendId)) {
        return res
          .status(400)
          .json({ success: false, message: "No pending friend request" });
      }
      // Check if the friend has a pending friend request from the user
      if (!friend.requestsSend.includes(id)) {
        return res
          .status(400)
          .json({ success: false, message: "No pending friend request" });
      }
      await userModel.findByIdAndUpdate(
        id,
        { $pull: { requests: friendId } },
        { new: true },
      );
      await userModel.findByIdAndUpdate(
        friendId,
        { $pull: { requestsSend: id } },
        { new: true },
      );
      await userModel.findByIdAndUpdate(
        id,
        { $push: { friends: friendId } },
        { new: true },
      );
      await userModel.findByIdAndUpdate(
        friendId,
        { $push: { friends: id } },
        { new: true },
      );
      res.status(200).json({
        success: true,
        message: "Friend request accepted successfully",
      });
    } else if (action === "reject") {
      // Check if the user has a pending friend request from the friend
      if (!user.requests.includes(friendId)) {
        return res
          .status(400)
          .json({ success: false, message: "No pending friend request" });
      }
      // Check if the friend has a pending friend request from the user
      if (!friend.requestsSend.includes(id)) {
        return res
          .status(400)
          .json({ success: false, message: "No pending friend request" });
      }
      await userModel.findByIdAndUpdate(
        id,
        { $pull: { requests: friendId } },
        { new: true },
      );
      await userModel.findByIdAndUpdate(
        friendId,
        { $pull: { requestsSend: id } },
        { new: true },
      );
      res.status(200).json({
        success: true,
        message: "Friend request rejected successfully",
      });
    }
    // // Remove the friend request from the user's requestsSend and the friend's requests
    // await userModel.findByIdAndUpdate(
    //   id,
    //   { $pull: { requestsSend: friendId } },
    //   { new: true },
    // );
    // await userModel.findByIdAndUpdate(
    //   friendId,
    //   { $pull: { requests: id } },
    //   { new: true },
    // );

    // // Add the friend to the user's friends and the user to the friend's friends
    // await userModel.findByIdAndUpdate(
    //   id,
    //   { $push: { friends: friendId } },
    //   { new: true },
    // );
    // await userModel.findByIdAndUpdate(
    //   friendId,
    //   { $push: { friends: id } },
    //   { new: true },
    // );

    // return res
    //   .status(200)
    //   .json({ success: true, message: "Friend request accepted successfully" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error accepting friend request",
      error,
    });
  }
});

module.exports = route;
