import User from '../models/user.model.js';
import { sendVerificationEmail, generateVerificationToken } from '../lib/emailService.js';

// Verify email with token
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('Verification request received for token:', token);
    console.log('Token length:', token ? token.length : 'undefined');

    if (!token) {
      console.log('No token provided');
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      });
    }

    // First, try to find user with the verification token
    console.log('Searching for user with token:', token);
    
    // Debug: Check what tokens exist in the database
    const allUsersWithTokens = await User.find({ 
      emailVerificationToken: { $exists: true, $ne: null } 
    }).select('email emailVerificationToken emailVerificationExpires isEmailVerified');
    
    console.log('All users with verification tokens:');
    allUsersWithTokens.forEach(u => {
      console.log(`- Email: ${u.email}, Token: ${u.emailVerificationToken?.substring(0, 10)}..., Expires: ${u.emailVerificationExpires}, Verified: ${u.isEmailVerified}`);
    });
    
    // Debug: Check if any user has this exact token (even if expired)
    const userWithExactToken = await User.findOne({ emailVerificationToken: token });
    console.log('User with exact token found:', userWithExactToken ? `Yes - ${userWithExactToken.email}` : 'No');
    
    // Debug: Check all users to see if any match this token pattern
    const allUsers = await User.find({}).select('email emailVerificationToken isEmailVerified');
    console.log('All users in database:');
    allUsers.forEach(u => {
      console.log(`- Email: ${u.email}, Has Token: ${u.emailVerificationToken ? 'Yes' : 'No'}, Verified: ${u.isEmailVerified}`);
    });
    
    let user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() } // Token not expired
    });
    
    console.log('User found with valid token:', user ? 'Yes' : 'No');

    // If not found, check if user is already verified (token was already used)
    if (!user) {
      console.log('Checking if user is already verified...');
      user = await User.findOne({
        emailVerificationToken: token
      });
      
      console.log('User found with token (already used):', user ? 'Yes' : 'No');
      console.log('User isEmailVerified:', user ? user.isEmailVerified : 'N/A');
      
      if (user && user.isEmailVerified) {
        // User is already verified, return success
        console.log('Returning success for already verified user');
        return res.json({
          success: true,
          message: 'Email is already verified',
          user: {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            isEmailVerified: user.isEmailVerified
          }
        });
      }
      
      // Token is invalid or expired
      console.log('Token is invalid or expired - token not found in database');
      return res.status(400).json({
        success: false,
        message: 'This verification link is no longer valid. Please request a new verification email from the login page.',
        action: 'request_new_email'
      });
    }

    // Update user as verified
    user.isEmailVerified = true;
    // Don't clear the token - keep it so we can detect already verified users
    // user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerificationAttempts = 0;
    
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during email verification'
    });
  }
};

// Resend verification email
export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Check verification attempts (max 3 per hour)
    if (user.emailVerificationAttempts >= 3) {
      const lastAttempt = user.updatedAt;
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      if (lastAttempt > oneHourAgo) {
        return res.status(429).json({
          success: false,
          message: 'Too many verification attempts. Please try again in an hour.'
        });
      } else {
        // Reset attempts if it's been more than an hour
        user.emailVerificationAttempts = 0;
      }
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    user.emailVerificationAttempts += 1;
    
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.fullName,
      verificationToken
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Check verification status
export const checkVerificationStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      isEmailVerified: user.isEmailVerified,
      email: user.email,
      fullName: user.fullName
    });

  } catch (error) {
    console.error('Check verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Send verification email for existing user (admin function)
export const sendVerificationEmailToUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'User email is already verified'
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    
    await user.save();

    // Send verification email
    const emailResult = await sendVerificationEmail(
      user.email,
      user.fullName,
      verificationToken
    );

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Send verification email to user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
