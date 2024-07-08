import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../model/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const like = await Like.findOne({ video: videoId, user: req.user._id });
  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.json(new ApiResponse(200, null, "Like removed"));
  } else if (!like) {
    const newLike = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    if (!newLike) {
      throw new ApiError(500, "Failed to like video");
    }
    res.status(201).json(new ApiResponse(201, newLike, "Video liked"));
  }
  //TODO: toggle like on video
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const like = await Like.findOne({ comment: commentId, user: req.user._id });
  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.json(new ApiResponse(200, null, "Like removed"));
  } else if (!like) {
    const newLike = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    if (!newLike) {
      throw new ApiError(500, "Failed to like comment");
    }
    res.status(201).json(new ApiResponse(201, newLike, "Comment liked"));
  }
  //TODO: toggle like on comment
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }
  const like = await Like.findOne({ tweet: tweetId, likedBy: req.user._id });
  if (like) {
    await Like.findByIdAndDelete(like._id);
    return res.json(new ApiResponse(200, null, "Like removed"));
  } else if (!like) {
    const newLike = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    if (!newLike) {
      throw new ApiError(500, "Failed to like tweet");
    }
    res.status(201).json(new ApiResponse(201, newLike, "Tweet liked"));
  }
  //TODO: toggle like on tweet
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  });
  //TODO: get all liked videos
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
