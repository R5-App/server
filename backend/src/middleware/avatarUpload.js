const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads/avatars';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * Configure multer for avatar uploads
 * - Stores files with random names for security
 * - Validates file types (jpg, png)
 * - Limits file size to 500KB
 * - Keeps original filename in database for reference
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate random filename with original extension
        const ext = path.extname(file.originalname).toLowerCase();
        const randomName = crypto.randomBytes(16).toString('hex');
        const filename = `${randomName}${ext}`;
        cb(null, filename);
    }
});

/**
 * File filter to only allow jpg and png
 */
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Only JPG and PNG are allowed.`), false);
    }
};

/**
 * Multer configuration
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 500 * 1024  // 500KB max
    }
});

/**
 * Middleware to handle single avatar upload
 * Attach to route: router.post('/', authenticateToken, uploadAvatarMiddleware, uploadAvatar);
 */
const uploadAvatarMiddleware = (req, res, next) => {
    upload.single('avatar')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 500KB.'
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Too many files uploaded. Only one avatar allowed.'
                });
            }
            return res.status(400).json({
                success: false,
                message: `Upload error: ${err.message}`
            });
        } else if (err) {
            // Custom error from fileFilter
            return res.status(400).json({
                success: false,
                message: err.message
            });
        }

        // File uploaded successfully
        // Attach file info to request for controller to use
        if (req.file) {
            req.file.originalName = req.file.originalname;
            req.file.uploadedPath = `${uploadDir}/${req.file.filename}`;
        }
        next();
    });
};

module.exports = { uploadAvatarMiddleware, upload };
