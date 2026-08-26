const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/x-png', 'image/webp', 'application/octet-stream'];
  const ext = (file.originalname || '').toLowerCase();
  const hasValidExt = /\.(jpe?g|png|webp)$/i.test(ext);

  if (allowedMimeTypes.includes(file.mimetype) || hasValidExt) {
    cb(null, true);
  } else {
    cb(new Error('Invalid image type. Only JPEG, JPG, PNG, and WebP images are allowed.'), false);
  }
};

const uploadPaymentScreenshot = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: fileFilter
});

module.exports = { uploadPaymentScreenshot };
