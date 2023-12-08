const path = require("path");
const http = require("http");
const express = require("express");
const moment = require("moment");
const socketio = require("socket.io");
const { generateMessage, saveMessage, getConversation } = require("./utils/messages.js")
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users.js")
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
    const error = req.flash('error')[0] || null; // Get the flash message
    res.render('index', { error });
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
        res.render('chat', { user });
    } catch (e) {
        // Set a flash message
        req.flash('error', 'Invalid credentials');
        res.redirect('/');
    }
});

io.on("connection", (socket) => {

    socket.on("join", async (sender, callback) => {
        const user = await getUser(sender);
        const room = user[0].conversationId;
        socket.join(room);
        // socket.emit("message", generateMessage("Admin", "WelCome", room), () => { });
        // socket.broadcast.to(room).emit("message", generateMessage("Admin", `${user.name} has joined.`, room));
        io.to(room).emit("roomData", {
            room: user[0].name,
            users: await getUsersInRoom(room)
        })
        callback({ userId: socket.id, code: 200 })
    })
    socket.on("sendMessage", async ({ message, from, to }, callback) => {
        const user = await getUser(from);
        if (message != '') {
            io.to(to).emit("message", generateMessage(user[0].name, message, from));
            if (from != to) {
                io.to(from).emit("message", generateMessage(user[0].name, message, from));
            }
            saveMessage(user[0].name, message, from, to, 0);
            callback("OK!");
        }
    });

    socket.on("sendLocation", async (coords, callback) => {
        const user = await getUser(coords.from);
        const message = `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`;
        io.to(coords.to).emit("LocationMessage", generateMessage(user[0].name, message, coords.from));
        if (coords.from != coords.to) {
            io.to(coords.from).emit("message", generateMessage(user[0].name, message, coords.from));
        }
        saveMessage(user[0].name, message, coords.from, coords.to, 1);
        callback("Location sent.");
    });

    socket.on("disconnect", () => {
        const user = removeUser(socket.id);
        if (user) {
            // io.to(user.room).emit("message", generateMessage("Admin", `${user.username} has left.`), socket.id)
            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    });
    socket.on("chatUserDetails", async (id, callback) => {
        const user = await getUser(id);
        callback(user);
    })

    socket.on("getconversation", async ({ sender, reciver ,logedUser}, callback) => {
        const messagesArray = await getConversation(sender, reciver);
        const messages = [];
        messagesArray.forEach(message => {
            const temp = {};
            temp.name = message.name,
            temp.from = message.from,
            temp.to = message.to
            temp.message = message.message
            temp.createdAt = moment(message.createdAt).format("h:mm a"),
            temp.senderClass = (sender == message.from ? "reciver" : "sender")
            messages.push(temp)
        });
        console.log('messages - ',messages);
        callback(messages)
    })
});

server.listen(port, () => console.log(`app listening on port ${port}!`));
