require('../db/mongoose')
const Users = require('../models/users')
const users = [];


const addUser = async (userData) => {
    name = userData.username.trim().toLowerCase();
    email = userData.email.trim().toLowerCase();
    password = userData.password.trim().toLowerCase();
    personalId = (Math.random() + 1).toString(36).substring(2);
    profile = userData.profile;
    if (!email || !password) return { error: 'Email and password are required' };
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
        }));
        return contacts;
    } catch (error) {
        // Handle errors, e.g., user not found or database error
        console.error('Error fetching contacts:', error.message);
        throw error;
    }
}


module.exports = {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom,
    getContactsOfUserByPersoanalId
}