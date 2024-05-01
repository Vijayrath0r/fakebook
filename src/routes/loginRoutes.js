
const express = require("express");
const Users = require('../models/users')
const { addUser } = require("../utils/users.js")
const router = express.Router();

router.get('/', async (req, res) => {
    if (req.session.user && req.session.user._id) {
        res.render('chat', { user: req.session.user });
    } else {
        const error = req.flash('error')[0] || null; // Get the flash message
        res.render('index', { error });
    }
})
router.get('/login', async (req, res) => {
    if (req.session.user && req.session.user._id) {
        res.render('chat', { user: req.session.user });
    } else {
        res.redirect('/');
    }
})

router.get('/logout', async (req, res) => {
    req.session.user = {};
    req.session.save();
    res.redirect('/');
})

router.get('/createUser', async (req, res) => {
    const error = req.flash('error')[0] || null; // Get the flash message
    const images = ["profile01", "profile02", "profile03", "profile04", "profile05", "profile06"];
    res.render('createuser', { error, images });
})

router.post('/createUser', async (req, res) => {
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

router.post('/login', async (req, res) => {
    try {
        const user = await Users.findByCredentials(req.body.email, req.body.password)
        req.session.user = user;
        req.session.save();
        res.render('chat', { user });
    } catch (e) {
        // Set a flash message
        console.log(e);
        req.session.user = {};
        req.session.save();
        req.flash('error', 'Invalid credentials');
        res.redirect('/');
    }
});

module.exports = router;