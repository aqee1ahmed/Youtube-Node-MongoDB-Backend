import dotenv from "dotenv";
import { app } from "./app.js";
import connectDB from "./db/index.js";

const PORT = process.env.PORT || 3001;

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server is listening on port " + PORT + "...");
    });
  })
  .catch((error) => {
    console.log("Error connecting to the database: ", error);
    process.exit(1);
  });
