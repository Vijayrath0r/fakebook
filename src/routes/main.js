require('dotenv').config();
const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
require('../db/mongoose')
const session = require('express-session');
const flash = require('express-flash');
const messageRoutes = require('./messageRoutes');
const loginRoutes = require('./loginRoutes');
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

app.use('/', loginRoutes);
app.use('/messages', messageRoutes);


module.exports = { app, server, io, port };