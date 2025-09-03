import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";


export const signup = async (req,res) => {
  const { email, fullName, password } = req.body; 
  try {
    
    //check if all fields are filled
    if (!email || !fullName || !password){
      return res.status(400).json({message: "All fields are required"});
    }

    //check password length
    if (password.length < 6){
      return res.status(400).json({message: "Password must be at least 6 characters long"});
    }
    
    //check if the email exist already
    const user = await User.findOne({email: email});
    if(user){
      return res.status(400).json({message: "User already exists"});
    }

    //hash the password
    const salt = await bcrypt.genSalt(10) // generates a random string (salt) to make the hash unique.
    const hashedPassword = await bcrypt.hash(password,salt); // Combines the password and salt to generate a secure hashed version of the password.

    //create a new user and save
    const newUser = new User({
      fullName,
      email,
      password: hashedPassword
    });

    //if user created successfully
    if(newUser){
      //geneterate and return JWT token
      generateToken(newUser._id, res);

      //save the user to the database
      await newUser.save();
  
      //send the user data to the frontend(client)
      res.status(201).json({
        _id:newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic
      })
//       above JSON response allows the frontend to:

//       Confirm that the user has been successfully registered.
//       Access the newly created user's data (e.g., fullName and email).
//       Use the user's _id for further operations like token generation or navigation.
//       Optionally, display or use the profilePic if needed.
    }

    else{ //if couldn't create user
      res.status(400).json({message: "invalid user data"});
    }

  } catch (error) {
    console.log("Error in signup controller: ", error.message);
    res.status(500).json({message: "Internal server error"});
  }
};

export const login = async(req, res) => {
  const { email, password } = req.body;
  try {
    // whether the user exists?
    const user = await User.findOne({email: email});
    if(!user){
      return res.status(400).json({message: "User does not exist"});
    }

    // if user exists check password is correct or not
                                        // compare(password user enters ,one in the database)
    const isPasswordCorrect = await bcrypt.compare(password, user.password)//this will return true or false
    if(!isPasswordCorrect){
      return res.status(400).json({message: "Invalid credentials"});
    }

    // if password is correct generate the token
    generateToken(user._id, res);

    // send the user data to the frontend(client)
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic
    });

  } catch (error) {
    console.log("Error in login controller: ", error.message);
    res.status(500).json({message: "Internal server error"});
  }
}

export const logout = (req,res) => {
  try {
    // clearing the JWT cookie
    res.cookie("jwt","",{maxAge:0});
    res.status(200).json({message: "Logged out successfully"});
  } catch (error) {
    console.log("Error in login controller: ", error.message);
    res.status(500).json({message: "Internal server error"});
  }
};


export const updateProfile = async (req,res) => {
  // here we only update the profile photo. Full name or email cant be edited according to our application
  // to be able to update our profile pic, we need a service(cloudinary) so we can upload our images

  try {
    // when user wants to update profile image, first they need to send us
    const {profilePic} = req.body; //aluthen danna one photo eka
    // check which user this is
    const userId = req.user._id;

    if(!profilePic){ //aluthen danna one photo eka user dunne nttn
      return res.status(400).json({message: "Profile pic is required"});
    }

    // if profile picture is provided, upload it to cloudinary(cloudinary is a bucket for our images)
    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    // Update the user in database
    const updatedUser = await User.findByIdAndUpdate(userId, {profilePic: uploadResponse.secure_url}, {new:true});
    // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true,
    // findOneAndUpdate() will instead give you the object after update was applied.

    res.status(200).json(updatedUser);

  } catch (error) {
    console.log("error in update profile: ",error);
    res.status(500).json({message: "Internal server error"});
  }
};


export const checkAuth = (req,res) => {
  // We r gonna be calling this function whenever we refresh the application. And we check if the user is authenticated or not
  // user log wela nm req.user labenw. nttn "message": "Unauthorized - No Token Provided" labenw
  try {
    // send the user back to the client
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller: ", error.message);
    res.status(500).json({message: "Internal server error"});
  }
};