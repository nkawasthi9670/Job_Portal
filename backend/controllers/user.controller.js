import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";

// ---------------------- REGISTER ----------------------
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email.",
        success: false,
      });
    }

    let profilePhotoUrl = "";

    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      profilePhotoUrl = cloudResponse.secure_url;
    } else {
      profilePhotoUrl = "https://via.placeholder.com/150"; // Default profile photo
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: profilePhotoUrl,
      },
    });

    return res.status(201).json({
      message: "Account created successfully.",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ---------------------- LOGIN ----------------------
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;


    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    if (role !== user.role) {
      return res.status(400).json({
        message: "Account doesn't exist with the current role.",
        success: false,
      });
    }

    const tokenData = { userId: user._id };
   
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, { expiresIn: "1d" });
       


    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200)
      .cookie("token", token, {
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 day
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        success: true,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ---------------------- LOGOUT ----------------------
export const logout = async (req, res) => {
  try {
    return res.status(200)
      .cookie("token", "", { maxAge: 0 })
      .json({
        message: "Logged out successfully.",
        success: true,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};

// ---------------------- UPDATE PROFILE ----------------------
export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const userId = req.id; // Middleware se user ki id aayi hogi

    let user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        message: "User not found.",
        success: false,
      });
    }

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skills.split(",");

    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content, {
        resource_type: "raw"
      });

      console.log("Cloudinary Response:", cloudResponse);  

      if (cloudResponse) {
        user.profile.resume = cloudResponse.secure_url;
        user.profile.resumeOriginalName = req.file.originalname;
      }
    }

    await user.save();

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res.status(200).json({
      message: "Profile updated successfully.",
      user,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", success: false });
  }
};
