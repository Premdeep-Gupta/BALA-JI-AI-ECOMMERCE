import multer from "multer";

// Memory storage is perfect for Cloudinary streaming
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  // Single image ya multiple image upload ke liye strict limits
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  },
  // Extra safety: sirf images allow karein
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  }
});