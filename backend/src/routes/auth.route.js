import express from 'express'
import { signup, login, logout, updateProfile, checkAuth } from '../controllers/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);
// If user wants to update the profile, first we have to check if they are logged in?

router.get("/check", protectRoute, checkAuth)
// We are gonna call this function whenever we refresh the page


export default router;