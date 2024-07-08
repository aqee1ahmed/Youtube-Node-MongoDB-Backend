import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../model/tweet.model.js";
import { User } from "../model/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  const tweet = await Tweet.create({ content: content, owner: req.user._id });
  res.status(201).json(new ApiResponse(201, tweet, "Tweet created"));
  //TODO: create tweet
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "Invalid user ID");
  }
  const userTweets = await Tweet.find({ owner: userId });
  res.json(new ApiResponse(200, userTweets, "User tweets"));
  // TODO: get user tweets
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  const updateTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    { content: content },
    { new: true }
  );
  res.json(new ApiResponse(200, updateTweet, "Tweet updated"));
  //TODO: update tweet
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id.toString();
  const result = await Tweet.deleteOne({ _id: tweetId, owner: userId });

  if (result.deletedCount === 0) {
    throw new ApiError(
      403,
      "You are not authorized to delete this tweet or tweet does not exist"
    );
  }

  res.json(new ApiResponse(200, {}, "Tweet deleted"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
