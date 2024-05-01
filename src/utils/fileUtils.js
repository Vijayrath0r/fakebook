const fs = require('fs');

exports.deleteLocalFiles = (files) => {
    files.forEach(file => {
        fs.unlink(file.path, err => {
            if (err) {
                console.error('Error deleting file:', file.path, err);
            } else {
                console.log('File deleted:', file.path);
            }
        });
    });
};
