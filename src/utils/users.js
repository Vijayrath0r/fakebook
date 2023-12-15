require('../db/mongoose')
const Users = require('../models/users')
const users = [];
const onlineUsers = [];

const addUser = async (userData) => {
    name = userData.username.trim().toLowerCase();
    email = userData.email.trim().toLowerCase();
    password = userData.password.trim().toLowerCase();
    personalId = (Math.random() + 1).toString(36).substring(2);
    profile = userData.profile;
    if (!email || !password) return { error: 'Email and password are required' };
    if (!validateEmail(email)) return { error: "Please enter an valid Email." }
    if (!validatePassword(password)) return { error: "Please use strong password." }
    let existingUser = await Users.find({ email });
    if (existingUser && existingUser.length > 0) {
        return { error: 'Email is Aleardy taken' }
    }
    const userdata = { name, email, password, personalId, profile }
    console.log('userData - ', userData);
    // const user = new Users(userdata)
    // user.save()
    return { user };
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) {
        return users.splice(index, 1)[0];
    }
}

const getUser = async (id) => {
    return await Users.find({ personalId: id }, "name personalId profile");
}

const getUsersInRoom = async (room) => {
    return await Users.find({}, "name personalId profile");
}

const markOnline = async (personalId, socketId) => {
    onlineUsers[personalId] = socketId;
    console.log(onlineUsers);
}

const isUserOnline = (userId) => {
    return (onlineUsers[userId]) ? true : false;
}

const markOffline = (socketId) => {
    const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socketId);
    if (userId) {
        delete onlineUsers[userId];
        return userId;
    }
    return null;
}

const getContactsOfUserByPersoanalId = async (personalId) => {
    try {
        // Find the user by the provided id and populate the 'friends' field
        const user = await Users.findOne({ personalId }).populate('friends', 'name personalId profile');

        if (!user) {
            throw new Error('User not found');
        }

        // Extract the relevant information from the populated 'friends' field
        const contacts = user.friends.map(friend => ({
            name: friend.name,
            personalId: friend.personalId,
            profile: friend.profile,
            onlineStatus: (isUserOnline(friend.personalId) ? "online" : "offline"),
            onlineTime: (isUserOnline(friend.personalId) ? "Online" : "left 7 mins ago")
        }));
        return contacts;
    } catch (error) {
        // Handle errors, e.g., user not found or database error
        console.error('Error fetching contacts:', error.message);
        throw error;
    }
}

const validateEmail = (email) => {
    const emailRegexp = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z](?:[a-zA-Z-]{0,61}[a-zA-Z])?(?:\.[a-zA-Z](?:[a-zA-Z-]{0,61}[a-zA-Z]){1,}?)*$/;
    return emailRegexp.test(email);
}

const validatePassword = (password) => {
    const passRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return passRegex.test(password);
}

module.exports = {
    addUser,
    removeUser,
    getUser,
    getContactsOfUserByPersoanalId,
    markOnline,
    markOffline
}