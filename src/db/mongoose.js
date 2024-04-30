const mongoose = require('mongoose')
console.log(process.env);
mongoose.connect(process.env.MONGODB_URL);