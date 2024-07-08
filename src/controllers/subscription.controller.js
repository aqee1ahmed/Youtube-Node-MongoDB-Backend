import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../model/user.model.js";
import { Subscription } from "../model/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import e from "express";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const subscriberId = req.user._id;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }
  const existingSubscription = await Subscription.findOne({
    channel: channelId,
    subscriber: subscriberId,
  });
  if (existingSubscription) {
    await Subscription.findByIdAndDelete(existingSubscription._id);
    res.json(new ApiResponse(200, {}, "Subscription toggled"));
    return;
  } else if (!existingSubscription) {
    await Subscription.create({
      channel: channelId,
      subscriber: subscriberId,
    });
  }
  res.json(new ApiResponse(200, {}, "Subscription toggled"));
  // TODO: toggle subscription
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found");
  }
  const subscribers = await Subscription.countDocuments({
    channel: channelId,
  });
  res.json(new ApiResponse(200, subscribers, "Channel subscribers"));
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }
  const subscriber = await User.findById(subscriberId);
  if (!subscriber) {
    throw new ApiError(404, "Subscriber not found");
  }
  const subscribedChannels = await Subscription.countDocuments({
    subscriber: subscriberId,
  });
  res.json(new ApiResponse(200, subscribedChannels, "Subscribed channels"));
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
