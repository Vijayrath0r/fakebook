const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require('fs');

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

exports.uploadFileToS3 = async (file) => {
    const fileStream = fs.createReadStream(file.path);

    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: "shared/" + file.filename,
        Body: fileStream
    };

    try {
        const command = new PutObjectCommand(uploadParams);
        const data = await s3Client.send(command);
        return data.Location;
    } catch (error) {
        throw error;
    }
};

exports.uploadFilesToS3 = async (files) => {
    const uploadPromises = files.map(file => this.uploadFileToS3(file));
    return Promise.all(uploadPromises);
};