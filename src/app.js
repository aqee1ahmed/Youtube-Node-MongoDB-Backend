import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import logger from "../logger.js";
import morgan from "morgan";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

const morganFormat = ":method :url :status :response-time ms";
app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const parts = message.trim().split(" ");
        const logObject = {
          method: parts[0],
          url: parts[1],
          status: parts[2],
          responseTime: parts[3].replace("ms", ""),
        };
        const logString = Object.entries(logObject)
          .map(([key, value]) => `    "${key}": "${value}"`)
          .join("\n");

        const statusCode = parseInt(logObject.status, 10);
        let logLevel = "info";
        if (statusCode >= 200 && statusCode < 300) {
          logLevel = "info";
        } else if (statusCode >= 300 && statusCode < 400) {
          logLevel = "warn";
        } else if (statusCode >= 400 && statusCode < 500) {
          logLevel = "error";
        } else if (statusCode >= 500) {
          logLevel = "error";
        }
        logger[logLevel](`\n${logString}\n`);
      },
    },
  })
);

//middlewares
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import healthCheckRoute from "./routes/healthcheck.routes.js";
import userRoute from "./routes/user.routes.js";
import tweetRouter from "./routes/tweet.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";
import likeRouter from "./routes/like.routes.js";
import playlistRouter from "./routes/playlist.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

//routes
app.use("/api/v1/healthcheck", healthCheckRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/tweets", tweetRouter);
app.use("/api/v1/subscriptions", subscriptionRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/likes", likeRouter);
app.use("/api/v1/playlist", playlistRouter);
app.use("/api/v1/dashboard", dashboardRouter);

export { app };
