const mongoose = require('mongoose')

mongoose.connect(process.env.MONGODB_URL)

mongoose.connection.on('connected', function () {
    console.log('Mongoose default connection open to ' + process.env.MONGODB_URL);
});

// If the connection throws an error
mongoose.connection.on('error', function (err) {
    console.log('Mongoose default connection error: ' + err);
}); 