const express = require("express");
const multerMiddleware = require("../middleware/multerMiddleware");
const s3Service = require('../services/s3Service');
const { deleteLocalFiles } = require('../utils/fileUtils');
const router = express.Router();

// Define routes for message-related operations
router.post('/uploadImages', multerMiddleware.array('images'), async (req, res) => {
    const files = req.files;

    if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }
    // Upload each file to S3
    try {
        const results = await s3Service.uploadFilesToS3(files);
        let fileList = [];
        files.forEach((file) => {
            fileList.push(process.env.AWS_BUCKET_URL + "shared/" + file.filename);
        })
        deleteLocalFiles(files);
        res.status(200).json({ message: 'Files uploaded to S3 successfully', fileList });
    } catch (error) {
        console.error('Error uploading files to S3:', error);
        res.status(500).json({ error: 'Error uploading files to S3' });
    }
});

module.exports = router;
