"use server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import Exception from "../exceptions/exception.class";
import router from "next/router";

export const loginDb = async (values: any) => {
  const { email } = values;
  try {
    await connectDB();
    const user = await User.findOne({ email });
    console.log("user:" + user);
    if (!user) {
      return {
        error: Exception.emailNotFound,
      };
    } else {
      router.push("/");
    }
  } catch (error) {
  }
};
