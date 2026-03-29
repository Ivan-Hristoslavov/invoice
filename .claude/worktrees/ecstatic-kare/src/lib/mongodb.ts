import mongoose from "mongoose";
const { MONGODB_URI, DB_NAME} = process.env;
export const connectDB = async () => {
  try {
    const { connection } = await mongoose.connect(MONGODB_URI as string,{
        dbName: DB_NAME
    });
    if (connection.readyState === 1) {
      return Promise.resolve(true);
    }
  } catch (error) {
    console.error(error);
    return Promise.reject(error);
  }
};