const path = require("path");
const http = require("http");
const express = require("express");
const moment = require("moment");
const socketio = require("socket.io");
const { generateMessage, saveMessage, getConversation, markReadMessage, getLastReadMessage } = require("./utils/messages.js")
const { addUser, removeUser, getUser, getContactsOfUserByPersoanalId, markOnline, markOffline, searchContactsForUser } = require("./utils/users.js")
const { getConversationId, createNewConversation } = require("./utils/conversation.js")
require('./db/mongoose')
const Users = require('./models/users')
const session = require('express-session');
const flash = require('express-flash');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../public");
app.set('view engine', 'ejs');
app.set('views', publicDirectoryPath);
app.use(express.static(publicDirectoryPath));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(flash());
app.use(express.urlencoded({ extended: true }));


app.get('/', async (req, res) => {
    if (req.session.user && req.session.user._id) {
        res.render('chat', { user: req.session.user });
    } else {
        const error = req.flash('error')[0] || null; // Get the flash message
        res.render('index', { error });
    }
})

app.get('/login', async (req, res) => {
    if (req.session.user && req.session.user._id) {
        res.render('chat', { user: req.session.user });
    } else {
        res.redirect('/');
    }
})

app.get('/logout', async (req, res) => {
    req.session.user = {};
    req.session.save();
    res.redirect('/');
})

app.get('/createUser', async (req, res) => {
    const error = req.flash('error')[0] || null; // Get the flash message
    const images = ["profile01", "profile02", "profile03", "profile04", "profile05", "profile06"];
    res.render('createuser', { error, images });
})

app.post('/createUser', async (req, res) => {
    try {
        const { user, error } = await addUser(req.body)
        if (error) {
            throw new Error(error)
        }
        res.render('index', { user });
    } catch (e) {
        // Set a flash message
        req.flash('error', e.message);
        res.redirect('/createUser');
    }
})

app.post('/login', async (req, res) => {
    try {
        const user = await Users.findByCredentials(req.body.email, req.body.password)
        req.session.user = user;
        req.session.save();
        res.render('chat', { user });
    } catch (e) {
        // Set a flash message
        req.session.user = {};
        req.session.save();
        req.flash('error', 'Invalid credentials');
        res.redirect('/');
    }
});

const udpateUserList = async (roomName) => {
    const contacts = await getContactsOfUserByPersoanalId(roomName);
    io.to(roomName).emit("roomData", {
        users: contacts
    })
}
io.on("connection", (socket) => {

    socket.on("join", async (sender, callback) => {
        const user = await getUser(sender);
        const room = user[0].personalId;
        socket.join(room);
        udpateUserList(room);
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
        udpateUserList(sender);
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
});

server.listen(port, () => console.log(`app listening on port ${port}!`));
