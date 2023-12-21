const mongoose = require('mongoose')
const conversationSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        required: true
    },
    userIds: [{
        type: String,
        ref: 'User',
        required: true
    }],
    conversationType: {
        type: Number,
        required: true,
        default: 0 // 0 for personal chat and 1 for group chat.
    },
    lastReadMessage:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message' // 'User' should match the model name
    },
}, {
    timestamps: true
});

const Conversation = mongoose.model('Conversation', conversationSchema)

module.exports = Conversation