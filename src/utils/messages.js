require('../db/mongoose')
const Message = require('../models/message')
const Users = require('../models/users')

// const message = new Message({
//     name: "vijay rathor",
//     from: "vijay",
//     to: "suraj",
//     message: "hello",
//     messageType:0
// });
// message.save()
const getConversation = async (from, to) => {
    const tempMessages = await Message.find({
        $or: [
            { from: from, to: to },
            { from: to, to: from }
        ]
    })
    .sort({ createdAt: -1 }) // Sort by createdAt field in descending order
    .limit(20); // Limit to last 20 messages

    // Reverse the array to get the last 20 messages in ascending order
    const messagesAsc = tempMessages.reverse();

    return messagesAsc;
}
const generateMessage = (username, text, from, messageId) => {
    return {
        username,
        text,
        createdAt: new Date().getTime(),
        from,
        messageId
    }
}
const saveMessage = async (name, message, from, to, messageType) => {
    const messageobj = new Message({
        name,
        message,
        from,
        to,
        messageType
    });
    const messageData = await messageobj.save();
    return messageData._id;
}

const getLastReadMessage = async (to, from) => {
    const fromUser = await Users.findOne({ personalId: from }, "_id");

    if (!fromUser) return;
    const messageData = await Users.aggregate([
        { $match: { personalId: to } },
        {
            $unwind: '$friends',
        },
        { $match: { "friends.personalId": fromUser._id } },
        { $project: { _id: 0, lastReadMessage: "$friends.lastReadMessage" } },
    ])
    if (messageData && messageData.length > 0) {
        return messageData[0].lastReadMessage;
    } else {
        return;
    }
}
// getLastReadMessage("vijay12345678", "suraj12345678")

const markReadMessage = async (to, from) => {
    try {
        const message = await Message.findOne({ from, to }, '_id')
            .sort({ createdAt: -1 })
            .limit(1);
        if (message) {
            const messageId = message._id;

            const fromUser = await Users.findOne({ personalId: from });

            if (!fromUser) {
                throw new Error(`User with personalId ${from} not found`);
            }

            const toUser = await Users.findOneAndUpdate(
                { personalId: to, 'friends.personalId': fromUser._id },
                { $set: { 'friends.$.lastReadMessage': messageId } },
                { new: true }
            );
        } else {
            return;
        }
    } catch (error) {
        throw error;
    }
}

module.exports = {
    generateMessage,
    saveMessage,
    getConversation,
    markReadMessage,
    getLastReadMessage
}