const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const { addUser } = require("../utils/users.js")
require('../db/mongoose')
const Users = require('../models/users')
const session = require('express-session');
const flash = require('express-flash');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;
const publicDirectoryPath = path.join(__dirname, "../../public");
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

module.exports = { app, server, io, port };