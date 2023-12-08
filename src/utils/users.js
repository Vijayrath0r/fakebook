require('../db/mongoose')
const Users = require('../models/users')
const users = [];


const addUser = async (userData) => {
    name = userData.username.trim().toLowerCase();
    email = userData.email.trim().toLowerCase();
    password = userData.password.trim().toLowerCase();
    conversationId = (Math.random() + 1).toString(36).substring(2);
    profile = userData.profile;
    if (!email || !password) return { error: 'Email and password are required' };
    let existingUser = await Users.find({ email });
    if (existingUser && existingUser.length > 0) {
        return { error: 'Email is Aleardy taken' }
    }
    const userdata = { name, email, password, conversationId, profile }
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
    return await Users.find({ conversationId: id }, "name conversationId profile");
}

const getUsersInRoom = async (room) => {
    return await Users.find({}, "name conversationId profile");
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
}