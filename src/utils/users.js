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
    const user = new Users(userdata)
    user.save()
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
    try {
        const user = await Users.findOne({ personalId });
        if (user) {
            user.onlineStatus = 1;
            user.lastOnline = new Date();
            await user.save();
        }
        return user;
    } catch (error) {
        console.error(error);
        return null;
    }
}

const isUserOnline = (userId) => {
    return (onlineUsers[userId]) ? true : false;
}

const markOffline = async (socketId) => {
    try {
        const userId = Object.keys(onlineUsers).find(key => onlineUsers[key] === socketId);
        if (userId) {
            const user = await Users.findOne({ personalId:userId });
            if (user) {
                user.onlineStatus = 0;
                user.lastOnline = new Date();
                await user.save();
            }
            delete onlineUsers[userId];
            return userId;
        }
    } catch (error) {
    }
    return null;
}

const getLastOnlineTime = async (personalId) => {
    try {
        let user = await Users.findOne({ personalId }).select("lastOnline").exec();

        if (!user) {
            throw new Error('User not found');
        }

        let nowTime = new Date();
        let lastOnlineTime = new Date(user.lastOnline);
        let timeDifference = Math.floor((nowTime - lastOnlineTime) / 1000); // Convert to seconds

        if (timeDifference < 60) {
            return `left ${timeDifference} seconds ago`;
        } else if (timeDifference < 3600) {
            let minutes = Math.floor(timeDifference / 60);
            return `left ${minutes} minutes ago`;
        } else {
            let hours = Math.floor(timeDifference / 3600);
            return `left ${hours} hours ago`;
        }
    } catch (error) {
        console.error('Error getting last online time:', error.message);
        throw error;
    }
}

const getContactsOfUserByPersoanalId = async (personalId) => {
    try {
        // Find the user by the provided id and populate the 'friends' field
        const user = await Users.findOne({ personalId }).populate('friends', 'name personalId profile');

        if (!user) {
            throw new Error('User not found');
        }

        const contacts = user.friends.map(async friend => ({
            name: friend.name,
            personalId: friend.personalId,
            profile: friend.profile,
            onlineStatus: (isUserOnline(friend.personalId) ? "online" : "offline"),
            onlineTime: (isUserOnline(friend.personalId) ? "Online" : await getLastOnlineTime(friend.personalId))
        }));

        // Use Promise.all to wait for all the asynchronous getLastOnlineTime calls to complete
        const resolvedContacts = await Promise.all(contacts);

        return resolvedContacts;
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