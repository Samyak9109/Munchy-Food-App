import multer from "multer";

// store file in memory as buffer — we send it to cloudinary, not local disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/webm"];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // accept file
  } else {
    cb(new Error("Only images (jpeg, png, webp, jpg) and videos (mp4, webm) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

export default upload;