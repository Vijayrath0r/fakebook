require('../db/mongoose')
const mongoose = require("mongoose");
const Conversation = require('../models/conversation')
const Message = require('../models/message')

// const conversationData = new Conversation({
//     conversationId:"west1234",
//     userIds:[3333,4444]
// });
// conversationData.save()


const getConversationId = async (from, to) => {
    const tempmessage = await Conversation.find({
        userIds: {
            $all: [from, to]
        }
    });
    return tempmessage;
}
const addUserToConversation = async (conversationId, userId) => {
    const tempmessage = await Conversation.findOneAndUpdate({
        conversationId: conversationId
    }, {
        $addToSet: {
            userIds: userId
        }
    }, {
        new: true
    });
    return tempmessage;
}

const createNewConversation = async (from, to) => {
    const conversationId = from + "-" + to;
    const newConversation = new Conversation({
        userIds: [from, to],
        conversationId: conversationId
    });
    const result = await newConversation.save();
    return result;
}

const getUnreadMessageCount = async (from, to, lastReadMessage) => {
    if (!lastReadMessage || lastReadMessage == '') {
        return '';
    }

    const result = await Message.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(lastReadMessage)
            }
        },
        {
            $lookup: {
                from: 'messages', // Replace with your actual collection name
                let: { createdAt: '$createdAt' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$from', from] },
                                    { $gt: ['$createdAt', '$$createdAt'] }
                                ]
                            }
                        }
                    }
                ],
                as: 'unreadMessages'
            }
        },
        {
            $project: {
                unreadMessageCount: { $size: '$unreadMessages' }
            }
        }
    ]);

    if (result.length > 0) {
        return result[0].unreadMessageCount > 0 ? result[0].unreadMessageCount : '';
    } else {
        return '';
    }
}

module.exports = {
    getConversationId,
    createNewConversation,
    getUnreadMessageCount
}