// Lets config cloudinary
import {v2 as cloudinary} from "cloudinary"

import { config } from "dotenv"

config(); //to access environment variables

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;

// This is entire configuration that we need
// Once we upload images we'll be able to see them in the cludinary bucket