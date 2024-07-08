import mongoose from "mongoose";
import { Video } from "../model/video.model.js";
import { Subscription } from "../model/subscription.model.js";
import { Like } from "../model/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const totalSubscribers = await Subscription.countDocuments({
    channel: channelId,
  });
  const totalLikes = await Like.populate("video").countDocuments({
    "video.owner": channelId,
  });
  const totalVideos = await Video.countDocuments({ owner: channelId });
  const totalViews = await Video.aggregate([
    { $match: { owner: mongoose.Types.ObjectId(channelId) } },
    { $group: { _id: null, totalViews: { $sum: "$views" } } },
  ]);
  const channelName = await User.findById(channelId).select(
    "userName coverImage avatar"
  );
  res.json(
    new ApiResponse(200, {
      channelName: channelName.userName,
      coverImage: channelName.coverImage,
      avatar: channelName.avatar,
      totalSubscribers,
      totalLikes,
      totalVideos,
      totalViews: totalViews[0].totalViews,
    })
  );
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const videos = await Video.find({ owner: channelId });
  if (videos.length === 0) {
    throw new ApiError(404, "No videos found for the channel");
  }
  res.json(new ApiResponse(200, videos, "Channel videos"));
  // TODO: Get all the videos uploaded by the channel
});

export { getChannelStats, getChannelVideos };
