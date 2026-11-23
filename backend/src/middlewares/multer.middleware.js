import multer from "multer";

// Store file in memory as buffer — eliminate disk I/O
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/webm"];
  const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only images (jpeg, png, webp, jpg) and videos (mp4, webm) are allowed"), false);
  }
};

// General upload allowing up to 25MB (checked granularly below)
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max overall
  },
});

// Middleware to enforce: image <= 5MB, video <= 25MB
export const validateUploadLimits = (req, res, next) => {
  const checkFile = (f) => {
    if (f.mimetype.startsWith("image/") && f.size > 5 * 1024 * 1024) {
      return `Image '${f.originalname}' exceeds maximum allowed size of 5 MB.`;
    }
    if (f.mimetype.startsWith("video/") && f.size > 25 * 1024 * 1024) {
      return `Video '${f.originalname}' exceeds maximum allowed size of 25 MB.`;
    }
    return null;
  };

  if (req.file) {
    const err = checkFile(req.file);
    if (err) return res.status(400).json({ success: false, message: err });
  }

  if (req.files) {
    const allFiles = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    for (const f of allFiles) {
      const err = checkFile(f);
      if (err) return res.status(400).json({ success: false, message: err });
    }
  }

  next();
};

// Concurrency guard: allow only one active video upload at a time per user to avoid RAM spikes on 512MB RAM instances
const activeVideoUploads = new Set();

export const throttleVideoUpload = (req, res, next) => {
  const userId = req.user?._id?.toString() || req.partner?._id?.toString() || req.ip;
  if (activeVideoUploads.has(userId)) {
    return res.status(429).json({
      success: false,
      message: "A video upload is already in progress for your account. Please wait for it to complete.",
    });
  }

  activeVideoUploads.add(userId);

  const cleanup = () => {
    activeVideoUploads.delete(userId);
  };

  res.on("finish", cleanup);
  res.on("close", cleanup);
  res.on("error", cleanup);

  next();
};

export default upload;
