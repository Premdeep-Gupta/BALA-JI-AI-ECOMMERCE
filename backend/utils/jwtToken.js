import jwt from "jsonwebtoken";

export const sendToken = (user, statusCode, message, res) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

  // 🔥 Decide cookie name dynamically based on X-App-Type header to isolate sessions
  const appType = res.req?.headers?.["x-app-type"] || (user.role === "Admin" ? "Admin" : "User");
  const cookieName = appType === "Admin" ? "admin_token" : "user_token";

  const isProduction = process.env.NODE_ENV?.toLowerCase() === "production" || process.env.NODE_ENV?.toLowerCase() === "prod";
  res
    .status(statusCode)
    .cookie(cookieName, token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: isProduction, 
      sameSite: isProduction ? "None" : "Lax",
    })
    .json({
      success: true,
      user,
      message,
      token,
    });
};