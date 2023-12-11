require('../db/mongoose')
const Message = require('../models/message')

// const message = new Message({
//     name: "vijay rathor",
//     from: "vijay",
//     to: "suraj",
//     message: "hello",
//     messageType:0
// });
// message.save()
const getConversation = async (from, to) => {
    const tempmessage = await Message.find({
        $or: [
            { from: from, to: to },
            { from: to, to: from }
        ]
    });
    return tempmessage;
}
const generateMessage = (username, text, from) => {
    return {
        username,
        text,
        createdAt: new Date().getTime(),
        from
    }
}
const saveMessage = (name, message, from, to, messageType) => {
    const messageobj = new Message({
        name,
        message,
        from,
        to,
        messageType
    });
    messageobj.save()
}
module.exports = {
    generateMessage,
    saveMessage,
    getConversation
}