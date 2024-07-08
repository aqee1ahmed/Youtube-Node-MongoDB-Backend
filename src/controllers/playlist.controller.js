import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../model/playlist.model.js";
import { User } from "../model/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }
  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(500, "Failed to create playlist");
  }
  res.status(201).json(new ApiResponse(201, playlist, "Playlist created"));

  //TODO: create playlist
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  res.json(new ApiResponse(200, playlist, "Playlist found"));
  //TODO: get playlist by id
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "Invalid user ID");
  }
  const getUserPlaylists = await Playlist.find({ owner: userId });
  if (getUserPlaylists.length === 0) {
    throw new ApiError(404, "User has no playlists)");
  }
  res.json(new ApiResponse(200, getUserPlaylists, "User playlists"));
  //TODO: get user playlists
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }
  const addToPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );
  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }
  res.json(new ApiResponse(200, addToPlaylist, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid playlist or video ID");
  }
  const removedVideo = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );
  if (!playlist) {
    throw new ApiError(404, removedVideo, "Playlist not found");
  }
  // TODO: remove video from playlist
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const userId = req.user_id;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  res.json(new ApiResponse(200, deletedPlaylist, "Playlist deleted"));
  // TODO: delete playlist
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  if (!name || !description) {
    throw new ApiError(400, "Name and description are required");
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { name: name, description: description },
    { new: true }
  );
  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found");
  }
  res.json(new ApiResponse(200, updatedPlaylist, "Playlist updated"));
  //TODO: update playlist
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
