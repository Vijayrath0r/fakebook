const mongoose = require('mongoose')
const messageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    from: {
        type: String,
        ref: 'User', // refering to the personalId from User
        required: true
    },
    to: {
        type: String,
        ref: 'Conversation', // refering to the conversationId from Conversation
        required: true
    },
    message: {
        type: String,
        required: true
    },
    messageType: {
        type: Number,
        required: true,
        default: 0 // 0 for normal message, 1 for location message
    }
}, {
    timestamps: true
});
const Message = mongoose.model('Message', messageSchema)

module.exports = Message