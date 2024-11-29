const multer = require('multer');
const path = require('path');

// Set storage for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null,  '/home/anthonyweb/ebjv-api.imseoninja.com/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// File filter for images/videos only
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|mp4|avi|mkv|webp|pdf/;
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/avi",
    "video/x-matroska", // MIME type for .mkv files
    "application/pdf"
  ];

  const extName = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedMimeTypes.includes(file.mimetype);

  if (extName && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Only images, videos, and PDFs are allowed!"));
  }
};


// Set multer options
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50000000 } // 10MB file size limit
});

module.exports = upload;
