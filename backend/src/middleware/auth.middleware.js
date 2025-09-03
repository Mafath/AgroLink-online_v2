import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export const protectRoute = async(req,res,next) => {
  try {
    // grab the token from the cookie
    const token = req.cookies.jwt; // req.cookie.cookie name(use the cookie name we gave in the utils.js)
    // if there's not a token
    if(!token){
      return res.status(401).json({message: "Unauthorized - No Token Provided"});
    }
    // if there's a token we can check it's valid or not
    // to grab the token from the cookie we are gonna use the package called cookie parser- check index.js
    // decode the token to grab the userId(Why userId? because we stored userId in the token when creating token)
    // Api token eke encode krpu payload ek mehidi decode krnwa
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if(!decoded){
      return res.status(401).json({message: "Unauthorized - Invalid Token"});
    }
    // if the token is valid, we search for that user in the database, with that particular userId
    const user = await User.findById(decoded.userId).select("-password"); //we dont want to send the password to the frontend(client)

    if(!user){
      return res.status(404).json({message: "User not found"});
    }

    // Now user is authenticated


    req.user = user;

    next(); //call the next function.(updateProfile)






  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({message: "Internal server error"});
  }
}