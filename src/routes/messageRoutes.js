const express = require("express");
const multer = require('multer');
const path = require('path');
// Set up multer storage
const router = express.Router();
// Set up multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Specify the destination folder
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname)); // Set filename with timestamp
    }
});

// Initialize multer with storage options
const upload = multer({ storage: storage });

// Define routes for message-related operations
router.post('/mediaMessage', upload.array('images', 10), (req, res) => {
    // 'images' should match the field name used in the FormData

    // Access the uploaded files via req.files array
    const files = req.files;
    console.log(files);

    // Process each uploaded file
    files.forEach(file => {
        console.log('Received file:', file.filename);
        // Here, you can save the file to a storage system or perform any other necessary processing
    });

    // Send response indicating success
    res.status(200).send('Media messages received successfully');
});



module.exports = router;
