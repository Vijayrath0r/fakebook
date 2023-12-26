require('../db/mongoose')
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
    const conversations = await Message.findById(lastReadMessage);

    if (conversations) {
        const messages = await Message.find({
            from: from,
            createdAt: {
                $gt: conversations.createdAt
            }
        });
        if (messages.length > 0) {
            return messages.length;
        } else {
            return '';
        }
    } else {
        return '';
    }
}

module.exports = {
    getConversationId,
    createNewConversation,
    getUnreadMessageCount
}