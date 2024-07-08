import mongoose from "mongoose";
import { Comment } from "../model/comment.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const comments = await Comment.find({ video: videoId })
    .populate({
      path: "owner",
      select: "name",
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(limit * (page - 1));
  res.json(new ApiResponse(200, comments, "Video comments"));
});

const addComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  const ownerId = req.user._id;
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: ownerId,
  });
  if (!comment) {
    throw new ApiError(500, "Comment not added  ");
  }
  res.json(new ApiResponse(201, comment, "Comment added"));

  // TODO: add a comment to a video
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const ownerId = req.user._id;

  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  const updatedComment = await Comment.findByIdAndUpdate(
    { _id: commentId, owner: ownerId },
    { content },
    { new: true, runValidators: true }
  );

  if (!updatedComment) {
    throw new ApiError(
      404,
      "Unauthorized to update comment or comment not found"
    );
  }

  res.json(new ApiResponse(200, updatedComment, "Comment updated"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const ownerId = req.user._id;
  if (!mongoose.isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }
  const deletedComment = await Comment.findOneAndDelete(
    {
      _id: commentId,
      owner: ownerId,
    },
    { new: true }
  );
  if (!deletedComment) {
    throw new ApiError(
      404,
      "Unauthorized to delete comment or comment not found"
    );
  }
  res.json(new ApiResponse(200, deletedComment, "Comment deleted"));
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
