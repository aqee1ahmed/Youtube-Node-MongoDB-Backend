import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../model/video.model.js";
import { User } from "../model/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

import mongoosePaginate from "mongoose-paginate-v2";

Video.plugin(mongoosePaginate);

const getAllVideos = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      query,
      sortBy = "createdAt",
      sortType = "desc",
      userId,
    } = req.query;
    const options = {
      page,
      limit,
      sort: { [sortBy]: sortType === "desc" ? -1 : 1 },
      select: "title description owner createdAt", // Example projection
    };
    const queryObj = {};
    if (query) queryObj.title = { $regex: query, $options: "i" };
    if (userId) queryObj.owner = userId;

    const result = await Video.paginate(queryObj, options);
    res.json(new ApiResponse(200, result.docs, "All videos"));
  } catch (error) {
    // Handle error
    res.status(500).json({ message: error.message });
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const { _id } = req.user;
  const videoFileLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  if (!videoFile || !thumbnail) {
    throw new ApiError(400, "Video and thumbnail are required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Failed to upload video or thumbnail");
  }

  const video = await Video.create({
    title,
    description,
    owner: _id,
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
  });
  if (!video) {
    throw new ApiError(500, "Failed to create video");
  }
  res.status(201).json(new ApiResponse(201, video, "Video created"));

  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  res.json(new ApiResponse(200, video, "Video found"));
  //TODO: get video by id
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;
  const { title, description, thumbnail } = req.body;
  if (!title || !description || !thumbnail) {
    throw new ApiError(400, "Title, description and thumbnail are required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId, owner: _id },
    { title, description, thumbnail },
    { new: true }
  );
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found or not authorized to update");
  }
  res.json(new ApiResponse(200, updatedVideo, "Video updated"));

  //TODO: update video details like title, description, thumbnail
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const deletedVideo = await Video.findOneAndDelete({
    _id: videoId,
    owner: userId,
  });

  if (!deletedVideo) {
    throw new ApiError(404, "Video not found or not authorized to delete");
  }

  res.json(new ApiResponse(200, {}, "Video deleted"));
  //TODO: delete video file if stored externally
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId, owner: userId },
    [{ $set: { isPublished: { $not: "$isPublished" } } }],
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found or not authorized to update");
  }

  res.json(new ApiResponse(200, updatedVideo, "Video publish status toggled"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
