const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    messageType: {
        type: Number,
        required: true,
        default: 0
    }

}, {
    timestamps: true
})

const Message = mongoose.model('Message', messageSchema)

module.exports = Message