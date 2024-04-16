
const moment = require("moment");
const { generateMessage, saveMessage, getConversation, markReadMessage, getLastReadMessage } = require("../utils/messages.js")
const { getUser, getContactsOfUserByPersoanalId, markOnline, markOffline, searchContactsForUser } = require("../utils/users.js")
const { getConversationId, createNewConversation } = require("../utils/conversation.js")
const { sendFriendRequest, getRecivedRequestCount, getRecivedRequests, updateRequestStatus } = require("../utils/friendRequest.js")

const udpateUserList = async (io, roomName) => {
    const contacts = await getContactsOfUserByPersoanalId(roomName);
    io.to(roomName).emit("roomData", {
        users: contacts
    })
}
const socket = (io) => {
    io.on("connection", (socket) => {

        socket.on("join", async (sender, callback) => {
            const user = await getUser(sender);
            const room = user[0].personalId;
            socket.join(room);
            udpateUserList(io, room);
            markOnline(user[0].personalId, socket.id)
            callback({ userId: socket.id, code: 200 })
        })
        socket.on("sendMessage", async ({ message, from, to }, callback) => {
            const user = await getUser(from);
            if (message != '') {
                let conversationData = await getConversationId(to, from);
                let conversationId = conversationData[0].conversationId;
                const messageId = await saveMessage(user[0].name, message, from, to, 0);
                socket.broadcast.to(conversationId).emit("message", generateMessage(user[0].name, message, from, messageId));
                if (from != to) {
                    io.to(from).emit("message", generateMessage(user[0].name, message, from, messageId));
                }
                io.emit("showNotification", { senderNotifincation: from, reciverNotification: to, userName: user[0].name, message })
                callback("OK!");
            }
        });

        socket.on("sendLocation", async (coords, callback) => {
            const user = await getUser(coords.from);
            const message = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
            let conversationData = await getConversationId(coords.to, coords.from);
            let conversationId = conversationData[0].conversationId;
            const messageId = await saveMessage(user[0].name, message, coords.from, coords.to, 1);
            socket.broadcast.to(conversationId).emit("LocationMessage", generateMessage(user[0].name, message, coords.from, messageId));
            if (coords.from != coords.to) {
                io.to(coords.from).emit("LocationMessage", generateMessage(user[0].name, message, coords.from, messageId));
            }
            io.emit("showNotification", { senderNotifincation: coords.from, reciverNotification: coords.to, userName: user[0].name, message })
            callback("Location sent.");
        });

        socket.on("disconnect", () => {
            const user = markOffline(socket.id);
            // if (user) {
            //     io.to(user.room).emit("roomData", {
            //         room: user.room,
            //         users: getContactsOfUserByPersoanalId(user.room)
            //     })
            // }
        });
        socket.on("chatUserDetails", async ({ reciver, sender }, callback) => {
            let conversationId;
            const user = await getUser(reciver);
            if (reciver == sender) {
                conversationId = user[0].personalId
            } else {
                let conversationData = await getConversationId(reciver, sender);
                if (conversationData.length < 1) {
                    conversationData = await createNewConversation(reciver, sender);
                    conversationId = conversationData.conversationId
                } else {
                    conversationId = conversationData[0].conversationId
                }
            }
            socket.join(conversationId);
            callback(user);
        })

        socket.on("getconversation", async ({ sender, reciver, logedUser }, callback) => {
            const messagesArray = await getConversation(sender, reciver);
            const lastReadMessageId = await getLastReadMessage(sender, reciver);
            const messages = [];
            messagesArray.forEach(message => {
                const temp = {};
                temp.messageId = message._id
                temp.name = message.name
                temp.from = message.from
                temp.to = message.to
                temp.messageType = message.messageType
                temp.message = message.message
                temp.createdAt = moment(message.createdAt).format("h:mm a")
                temp.senderClass = (sender == message.from ? "my-message float-right" : "other-message")
                temp.dateClass = (sender == message.from ? "text-right" : "text-left")
                messages.push(temp)
            });
            markReadMessage(sender, reciver);
            callback({ messages, lastReadMessageId })
        })
        socket.on("updateUserList", async ({ sender }, callback) => {
            udpateUserList(io, sender);
            callback("list Updated");
        })
        socket.on("typingSever", async ({ sender, reciver }) => {
            if (sender != reciver) {
                io.emit("typingClient", { senderTyping: sender, reciverTyping: reciver })
            }
        })
        socket.on('findContacts', async ({ sender, searchText }, callback) => {
            const contactList = await searchContactsForUser(sender, searchText);
            callback(contactList);
        })

        socket.on('addFriendRequest', async ({ senderId, reciver }, callback) => {
            let response = await sendFriendRequest(senderId, reciver);
            callback(response);
        })
        socket.on('getRequestCount', async ({ sendTo }, callback) => {
            let response = await getRecivedRequestCount(sendTo);
            callback(response);
        })

        socket.on('getRequestList', async ({ sendTo }, callback) => {
            let userList = await getRecivedRequests(sendTo);
            callback(userList);
        })

        socket.on('updateRequestStatus', async ({ from, to, status }, callback) => {
            let response = await updateRequestStatus(from, to, status);
            callback(response);
        })
    });
}

module.exports = socket;