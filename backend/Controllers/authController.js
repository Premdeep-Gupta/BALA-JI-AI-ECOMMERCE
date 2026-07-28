import crypto from "crypto";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncError.js";
import database from "../database/db.js";
import bcrypt from "bcryptjs";
import { sendToken } from "../utils/jwtToken.js";
import { generateResetPasswordToken } from "../utils/generateResetPasswordToken.js";
import { generateEmailTemplate } from "../utils/generateForgotPasswordEmailTemplate.js";
import { sendEmail } from "../utils/sendEmail.js";
import { v2 as cloudinary } from "cloudinary";
import jwt from "jsonwebtoken";

// ✅ 1. REGISTER CONTROLLER (With Phone Input Support)
export const register = catchAsyncErrors(async (req, res, next) => {
  // 🔥 UPDATED: req.body se phone parameter ko destructure kiya
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }
  if (password.length < 8 || password.length > 16) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  const isAlreadyRegistered = await database.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (isAlreadyRegistered.rows.length > 0) {
    return next(
      new ErrorHandler("User already registered with this email.", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 🔥 UPDATED: SQL Query aur inputs ($4) mein phone inject kiya (fallback null ke sath)
  const user = await database.query(
    "INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, 'User', $4) RETURNING *",
    [name, email, hashedPassword, phone || null]
  );
  sendToken(user.rows[0], 201, "User registered successfully", res);
});

// ✅ 2. LOGIN CONTROLLER
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please provide email and password.", 400));
  }
  
  // Support logging in with email OR phone number
  const user = await database.query(
    `SELECT * FROM users WHERE email = $1 OR phone = $2`, 
    [email, email]
  );
  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }
  
  const isPasswordMatch = await bcrypt.compare(password, user.rows[0].password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid email or password.", 401));
  }
  
  sendToken(user.rows[0], 200, "Logged In.", res);
});

// ✅ 3. GET USER PROFILE
export const getUser = catchAsyncErrors(async (req, res, next) => {
  const { user } = req;
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.status(200).json({
    success: true,
    user,
    token,
  });
});

// ✅ 4. LOGOUT CONTROLLER (Session-isolated based on X-App-Type)
export const logout = catchAsyncErrors(async (req, res, next) => {
  const appType = req.headers["x-app-type"];

  if (appType === "Admin") {
    res.cookie("admin_token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });
  } else {
    res.cookie("user_token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    })
    .cookie("token", "", {
      expires: new Date(Date.now()),
      httpOnly: true,
      secure: false,
      sameSite: "lax"
    });
  }

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
});

// ✅ 5. FORGOT PASSWORD OTP PIPELINE
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { emailOrPhone } = req.body;

  if (!emailOrPhone) {
    return next(new ErrorHandler("Please provide email or phone number.", 400));
  }

  const isEmail = emailOrPhone.includes("@");

  let userResult = await database.query(
    isEmail 
      ? `SELECT * FROM users WHERE email = $1`
      : `SELECT * FROM users WHERE phone = $1`,
    [emailOrPhone.trim()]
  );

  if (userResult.rows.length === 0) {
    return next(
      new ErrorHandler(
        `User not found with this ${isEmail ? "email" : "phone number"}.`,
        404
      )
    );
  }

  const user = userResult.rows[0];

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await database.query(
    `UPDATE users SET reset_otp = $1, reset_otp_expire = $2 WHERE id = $3`,
    [otp, otpExpire, user.id]
  );

  if (isEmail) {
    const subject = "Password Recovery OTP";
    const message = `
      <div style="font-family: sans-serif; padding: 20px; background-color: #090d16; color: #f1f5f9; border-radius: 12px; max-width: 500px; margin: auto;">
        <h2 style="color: #6366f1; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Password Recovery OTP</h2>
        <p style="font-size: 14px; line-height: 1.6; text-align: center;">Use the following 6-digit One Time Password (OTP) to reset your account password.</p>
        <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #1e293b; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: 800; color: #38bdf8; letter-spacing: 4px;">${otp}</span>
        </div>
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 20px;">This OTP will expire in 10 minutes. If you did not request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject,
        message,
      });

      res.status(200).json({
        success: true,
        message: `OTP sent to ${user.email} successfully.`,
      });
    } catch (error) {
      console.error("Email send failed", error);
      // Fallback to simulated mode if SMTP is not configured
      return res.status(200).json({
        success: true,
        simulated: true,
        message: "Email OTP could not be sent. Operating under Sandbox Mode.",
        simulatedOtp: otp,
      });
    }
  } else {
    // Phone verification simulation
    console.log(`[SMS SENDER SIMULATOR] Secure Reset OTP code ${otp} dispatched to phone number: ${emailOrPhone}`);
    res.status(200).json({
      success: true,
      message: `OTP sent to phone ${emailOrPhone} (Simulated).`,
      simulatedOtp: otp, // Returned for testing purposes
    });
  }
});

// ✅ 6. RESET PASSWORD CONTROLLER (LEGACY LINK-BASED)
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  if (!req.body.password || !req.body.confirmPassword) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  if (req.body.password !== req.body.confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  if (req.body.password.length < 8) {
    return next(new ErrorHandler("Password too short.", 400));
  }

  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await database.query(
    `SELECT * FROM users 
     WHERE reset_password_token = $1 
     AND reset_password_expire > NOW()`,
    [resetPasswordToken]
  );

  if (user.rows.length === 0) {
    return next(new ErrorHandler("Invalid or expired reset token.", 400));
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  const updatedUser = await database.query(
    `UPDATE users 
     SET password = $1, reset_password_token = NULL, reset_password_expire = NULL 
     WHERE id = $2 
     RETURNING *`,
    [hashedPassword, user.rows[0].id]
  );

  sendToken(updatedUser.rows[0], 200, "Password reset successfully", res);
});

// ✅ 6b. RESET PASSWORD WITH OTP CONTROLLER
export const resetPasswordWithOtp = catchAsyncErrors(async (req, res, next) => {
  const { emailOrPhone, otp, password, confirmPassword } = req.body;

  if (!emailOrPhone || !otp || !password || !confirmPassword) {
    return next(new ErrorHandler("All fields are required.", 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorHandler("Passwords do not match.", 400));
  }

  if (password.length < 8) {
    return next(new ErrorHandler("Password must be at least 8 characters.", 400));
  }

  const isEmail = emailOrPhone.includes("@");

  const userResult = await database.query(
    isEmail 
      ? `SELECT * FROM users WHERE email = $1`
      : `SELECT * FROM users WHERE phone = $1`,
    [emailOrPhone.trim()]
  );

  if (userResult.rows.length === 0) {
    return next(new ErrorHandler("User not found.", 404));
  }

  const user = userResult.rows[0];

  // Verify OTP matches and not expired
  if (!user.reset_otp || user.reset_otp !== otp) {
    return next(new ErrorHandler("Invalid OTP code.", 400));
  }

  if (new Date() > new Date(user.reset_otp_expire)) {
    return next(new ErrorHandler("OTP code has expired.", 400));
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const updatedUser = await database.query(
    `UPDATE users 
     SET password = $1, reset_otp = NULL, reset_otp_expire = NULL 
     WHERE id = $2 
     RETURNING *`,
    [hashedPassword, user.id]
  );

  sendToken(updatedUser.rows[0], 200, "Password reset successfully", res);
});

// ✅ 7. UPDATE ACCOUNT PASSWORD
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmNewPassword) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }
  const isPasswordMatch = await bcrypt.compare(
    currentPassword,
    req.user.password
  );
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Current password is incorrect.", 401));
  }
  if (newPassword !== confirmNewPassword) {
    return next(new ErrorHandler("New passwords do not match.", 400));
  }

  if (
    newPassword.length < 8 ||
    newPassword.length > 16 ||
    confirmNewPassword.length < 8 ||
    confirmNewPassword.length > 16
  ) {
    return next(
      new ErrorHandler("Password must be between 8 and 16 characters.", 400)
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await database.query("UPDATE users SET password = $1 WHERE id = $2", [
    hashedPassword,
    req.user.id,
  ]);

  res.status(200).json({
    success: true,
    message: "Password updated successfully.",
  });
});

// ✅ 8. UPDATE USER PROFILE IMAGE & INFORMATION (With Phone Edit Support)
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
  // 🔥 UPDATED: profile input body se phone number accept kiya
  const { name, email, phone } = req.body;
  if (!name || !email) {
    return next(new ErrorHandler("Please provide all required fields.", 400));
  }
  if (name.trim().length === 0 || email.trim().length === 0) {
    return next(new ErrorHandler("Name and email cannot be empty.", 400));
  }
  let avatarData = {};
  if (req.files && req.files.avatar) {
    const { avatar } = req.files;
    if (req.user?.avatar?.public_id) {
      await cloudinary.uploader.destroy(req.user.avatar.public_id);
    }

    const newProfileImage = await cloudinary.uploader.upload(
      avatar.tempFilePath,
      {
        folder: "Ecommerce_Avatars",
        width: 150,
        crop: "scale",
      }
    );
    avatarData = {
      public_id: newProfileImage.public_id,
      url: newProfileImage.secure_url,
    };
  }

  let user;
  // 🔥 UPDATED: Dono scenario data conditions mein phone field database inject kiya ($3 aur $4 columns pe)
  if (Object.keys(avatarData).length === 0) {
    user = await database.query(
      "UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *",
      [name, email, phone || null, req.user.id]
    );
  } else {
    user = await database.query(
      "UPDATE users SET name = $1, email = $2, avatar = $3, phone = $4 WHERE id = $5 RETURNING *",
      [name, email, avatarData, phone || null, req.user.id]
    );
  }

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: user.rows[0],
  });
});

export const sendOtp = catchAsyncErrors(async (req, res, next) => {
  const { email, phone, otp } = req.body;

  if (!email && !phone) {
    return next(new ErrorHandler("Please provide either email or phone node, and the OTP code.", 400));
  }
  if (!otp) {
    return next(new ErrorHandler("Please provide the OTP code.", 400));
  }

  if (email) {
    const subject = "Secure Identity Authorization OTP";
    const message = `
      <div style="font-family: sans-serif; padding: 20px; background-color: #090d16; color: #f1f5f9; border-radius: 12px; max-width: 500px; margin: auto;">
        <h2 style="color: #6366f1; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Security Authorization</h2>
        <p style="font-size: 14px; line-height: 1.6; text-align: center;">You requested a secure transaction code to authorize profile changes inside your dashboard.</p>
        <div style="background-color: #0f172a; padding: 15px; border-radius: 8px; text-align: center; border: 1px solid #1e293b; margin: 20px 0;">
          <span style="font-size: 28px; font-weight: 800; color: #38bdf8; letter-spacing: 4px;">${otp}</span>
        </div>
        <p style="font-size: 11px; color: #64748b; text-align: center; margin-top: 20px;">This code is private and will expire shortly. If you did not make this request, please change your credentials immediately.</p>
      </div>
    `;

    try {
      await sendEmail({
        email,
        subject,
        message,
      });

      return res.status(200).json({
        success: true,
        simulated: false,
        message: `OTP successfully dispatched to ${email}`,
      });
    } catch (err) {
      console.error("Email send failed", err);
      return res.status(200).json({
        success: true,
        simulated: true,
        error: err.message || "SMTP server unconfigured.",
        message: "SMTP Mail Dispatcher failed. Operating under local secure Sandbox Mode.",
      });
    }
  }

  if (phone) {
    console.log(`[SMS SENDER SIMULATOR] Secure OTP code ${otp} dispatched to phone number: ${phone}`);
    return res.status(200).json({
      success: true,
      simulated: true,
      message: `SMS OTP successfully simulated/dispatched to mobile node: ${phone}`,
    });
  }
});

// ✅ 10. GET ALL SAVED ADDRESSES FOR USER
export const getAddresses = catchAsyncErrors(async (req, res, next) => {
  const result = await database.query(
    `SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [req.user.id]
  );
  res.status(200).json({ success: true, addresses: result.rows });
});

// ✅ 11. ADD NEW ADDRESS
export const addAddress = catchAsyncErrors(async (req, res, next) => {
  const {
    fullName, phone, altPhone, addressLine1, addressLine2,
    landmark, city, state, country, pincode, addressType, instructions, isDefault
  } = req.body;

  if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
    return next(new ErrorHandler("Please fill all required address fields.", 400));
  }

  // If new address is default, unset all other defaults first
  if (isDefault) {
    await database.query(
      `UPDATE user_addresses SET is_default = false WHERE user_id = $1`,
      [req.user.id]
    );
  }

  const result = await database.query(
    `INSERT INTO user_addresses
      (user_id, full_name, phone, alt_phone, address_line1, address_line2, landmark, city, state, country, pincode, address_type, instructions, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      req.user.id, fullName, phone, altPhone || null,
      addressLine1, addressLine2 || null, landmark || null,
      city, state, country || "India", pincode,
      addressType || "Home", instructions || null, isDefault || false
    ]
  );

  res.status(201).json({ success: true, address: result.rows[0] });
});

// ✅ 12. DELETE ADDRESS
export const deleteAddress = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const check = await database.query(
    `SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2`,
    [id, req.user.id]
  );
  if (check.rows.length === 0) {
    return next(new ErrorHandler("Address not found.", 404));
  }
  await database.query(`DELETE FROM user_addresses WHERE id = $1`, [id]);
  res.status(200).json({ success: true, message: "Address deleted." });
});