// Middleware/uploadMiddleware.js
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

// For single file: upload.single('image')
// For multiple named fields: upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'aadharImage', maxCount: 1 }])

module.exports = { upload };