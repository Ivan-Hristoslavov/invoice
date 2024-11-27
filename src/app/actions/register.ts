"use server"
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import Exception from "../exceptions/exception.class";
export const register = async (values: any) => {
    const { email, password, name } = values;

    try {
        await connectDB();
        const userFound = await User.findOne({ email });
        if(userFound){
            return {
              error: Exception.emailExist,
            };
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
          name,
          email,
          password: hashedPassword,
        });
        const savedUser = await user.save();

    }catch(e){
        console.log(e);
    }
}