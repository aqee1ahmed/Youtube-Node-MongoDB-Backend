import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../model/user.model.js";
import { Video } from "../model/video.model.js";
import { Subscription } from "../model/subscription.model.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { model } from "mongoose";

// Generate access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    new ApiError(500, "Failed to generate token");
  }
};

// Register user
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, userName } = req.body;

  if (
    [fullName, email, password, userName].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }
  await User.findOne({ $or: [{ email }, { userName }] }).then((user) => {
    if (user) {
      throw new ApiError(400, "User with emal or name already exists");
    }
  });

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image are required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Failed to upload image");
  }

  const user = await User.create({
    fullName,
    email,
    password,
    userName: userName.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  if (!createUser) {
    throw new ApiError(500, "Failed to create user");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, createUser, "User registered successfully"));
});

// Login user
const loginUser = asyncHandler(async (req, res) => {
  const { email, userName, password } = req.body;

  if (!(email || userName)) {
    throw new ApiError(400, "Email or username is required");
  }

  const user = await User.findOne({ $or: [{ email }, { userName }] });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loginedUser = await User.findOne(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(new ApiResponse(200, loginedUser, "User logged in successfully"));
});

// Logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const option = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("refreshToken", option)
    .clearCookie("accessToken", option)
    .json(new ApiResponse(200, null, "User logged out successfully"));
});

// Refresh access token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(400, "unauthorized access");
  }
  try {
    const decodedRefreshToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedRefreshToken?._id);
    if (!user) {
      throw new ApiError(404, "Invalid Access Token");
    }

    if (user.refreshToken !== incommingRefreshToken) {
      throw new ApiError(400, "Invalid Access Token");
    }

    const { newAccessToken, newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    const option = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", newAccessToken, option)
      .cookie("refreshToken", newRefreshToken, option)
      .json(new ApiResponse(200, null, "Token refreshed successfully"));
  } catch (error) {
    throw new ApiError(400, "Invalid Access Token");
  }
});

// Change user password
const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

// Update user details
const updateUserDetails = asyncHandler(async (req, res) => {
  const { fullName, email, userName } = req.body;

  if ([fullName, email].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "all fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      fullName,
      email,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

// Update user avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar image are required");
  }

  const oldAvatar = req.user?.avatar;
  if (oldAvatar) {
    const publicId = oldAvatar.split("/").pop().split(".")[0];
    await deleteFromCloudinary(publicId);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar) {
    throw new ApiError(500, "Failed to upload image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      avatar: avatar.url,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User avatar updated successfully"));
});

// Update user cover image
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image are required");
  }

  const oldCoverImage = req.user?.coverImage;
  if (oldCoverImage) {
    const publicId = oldCoverImage.split("/").pop().split(".")[0];
    await deleteFromCloudinary(publicId);
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage) {
    throw new ApiError(500, "Failed to upload image");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      coverImage: coverImage.url,
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User cover image updated successfully"));
});

// // get channel profile
// const getUserChannelProfile = asyncHandler(async (req, res) => {
//   const { username } = req.params;

//   if (!username?.trim) {
//     throw new ApiError(400, "Username is required");
//   }
//   const channel = await User.aggregate([
//     {
//       $match: { userName: username.toLowerCase() },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "channel",
//         as: "subscribers",
//       },
//     },
//     {
//       $lookup: {
//         from: "subscriptions",
//         localField: "_id",
//         foreignField: "subscriber",
//         as: "subscribeTo",
//       },
//     },
//     {
//       $addFields: {
//         subscriberCount: { $size: "$subscribers" },
//         channelSubscribeToCount: { $size: "$subscribeTo" },
//         isSubscribed: {
//           $cond: {
//             if: { $in: [req.user?._id, "$subscribers.subscriber"] },
//             then: true,
//             else: false,
//           },
//         },
//       },
//     },
//     {
//       $project: {
//         fullName: 1,
//         userName: 1,
//         avatar: 1,
//         coverImage: 1,
//         isSubscribed: 1,
//         subscriberCount: 1,
//         channelSubscribeToCount: 1,
//       },
//     },
//   ]);

//   if (!channel?.length) {
//     throw new ApiError(404, "Channel not found");
//   }

//   return res
//     .status(200)
//     .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
// });

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim) {
    throw new ApiError(400, "Username is required");
  }

  const userChannelProfile = await User.findOne({
    userName: username.toLowerCase(),
  });

  if (!userChannelProfile) {
    throw new ApiError(404, "Channel not found");
  }

  const subscriberCount = await Subscription.countDocuments({
    channel: userChannelProfile._id,
  });

  const channelSubscriptions = await Subscription.countDocuments({
    subscriber: userChannelProfile._id,
  });

  const isSubscribed = await Subscription.exists({
    subscriber: req.user._id,
    channel: userChannelProfile._id,
  });

  const response = {
    _id: userChannelProfile._id,
    fullName: userChannelProfile.fullName,
    userName: userChannelProfile.userName,
    avatar: userChannelProfile.avatar,
    coverImage: userChannelProfile.coverImage,
    subscriberCount,
    channelSubscriptions,
    isSubscribed: isSubscribed ? true : false,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, response, "Channel fetched successfully"));
});

// get watch history
// const getWatchHistory = asyncHandler(async (req, res) => {
//   const user = await User.aggregate([
//     {
//       $match: { _id: req.user?._id },
//     },
//     {
//       $lookup: {
//         from: "videos",
//         localField: "watchHistory",
//         foreignField: "_id",
//         as: "watchHistory",
//         pipeline: [
//           {
//             $lookup: {
//               from: "users",
//               localField: "owner",
//               foreignField: "_id",
//               as: "owner",
//               pipeline: [
//                 {
//                   $project: {
//                     fullName: 1,
//                     userName: 1,
//                     avatar: 1,
//                   },
//                 },
//                 {
//                   $addFields: {
//                     owner: { $first: "$owner" },
//                   },
//                 },
//               ],
//             },
//           },
//         ],
//       },
//     },
//   ]);

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         user[0].watchHistory,
//         "Watch history fetched successfully"
//       )
//     );
// });

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.user._id })
    .populate({
      path: "watchHistory",
      populate: {
        path: "owner",
        select: "fullName userName avatar",
      },
    })
    .exec();

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user.watchHistory,
        "Watch history fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeUserPassword,
  getCurrentUser,
  updateUserDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
