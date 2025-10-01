import express from 'express'
import { signup, signin, login, logout, updateProfile, getCurrentUser, checkAuth, getAdminStats, adminListUsers, adminUpdateUser, adminDeleteUser, adminCreateUser, getAgronomists, changeEmail, verifyEmailChange, changePassword, getLoginHistory, deleteAccount } from '../controllers/auth.controller.js'
import { requireAuth, protectRoute, requireRole } from '../middleware/auth.middleware.js';


const router = express.Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/login", login);
router.post("/logout", requireAuth, logout);

router.put("/update-profile", requireAuth, updateProfile);
// If user wants to update the profile, first we have to check if they are logged in?

router.get("/me", requireAuth, getCurrentUser)
router.get("/check", requireAuth, checkAuth)
// We are gonna call this function whenever we refresh the page

// Example ADMIN protected route (for demonstration)
router.get("/admin/ping", requireAuth, requireRole("ADMIN"), (req, res) => {
  res.status(200).json({ ok: true, role: req.user.role });
});

// Admin stats
router.get("/admin/stats", requireAuth, requireRole("ADMIN"), getAdminStats)

// Admin user management
router.get("/admin/users", requireAuth, requireRole("ADMIN"), adminListUsers)
router.post("/admin/users", requireAuth, requireRole("ADMIN"), adminCreateUser)
router.put("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminUpdateUser)
router.delete("/admin/users/:id", requireAuth, requireRole("ADMIN"), adminDeleteUser)

// Public endpoint to fetch agronomists (for harvest reports)
router.get("/agronomists", requireAuth, getAgronomists)

// Security endpoints
router.post("/change-email", requireAuth, changeEmail)
router.get("/verify-email-change/:token", verifyEmailChange)
router.post("/change-password", requireAuth, changePassword)
router.get("/login-history", requireAuth, getLoginHistory)
router.delete("/delete-account", requireAuth, deleteAccount)

export default router;