import mongoose from "mongoose";
import { DB_NAME } from "../contants.js";

const connectDB = async () => {
  try {
    const connectionInstence = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `Connected to the database:  ${connectionInstence.connection.host}`
    );
  } catch (error) {
    console.log("Error connecting to the database: ", error);
    process.exit(1);
  }
};

export default connectDB;
