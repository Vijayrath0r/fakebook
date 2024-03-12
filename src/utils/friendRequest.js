require('../db/mongoose')
const FriendRequest = require('../models/friendRequest')
const { addFriendToUser } = require('./users');

const sendFriendRequest = async (senderId, receiverId) => {
    try {
        // Check if a friend request already exists with the same sender and receiver
        const existingRequest = await FriendRequest.findOne({ from: senderId, to: receiverId });

        if (existingRequest) {      // Friend request already exists.
            existingRequest.status = '1';
            await existingRequest.save();
            return existingRequest;
        } else {                    // Create a new friend request
            const newRequest = new FriendRequest({
                from: senderId,
                to: receiverId,
                status: '1' // Default status is '1' for 'pending'
            });
            await newRequest.save(); // Friend request sent successfully.
            return newRequest;
        }
    } catch (error) { // Error sending friend request
        throw error;
    }
}
async function getRecivedRequestCount(userId) {
    try {
        const count = await FriendRequest.countDocuments({ to: userId, status: '1' });
        return count;
    } catch (error) {
        throw error; // Propagate the error for handling at a higher level
    }
}
async function getRecivedRequests(userId) {
    try {
        let userList = [];
        const requests = await FriendRequest.find({ to: userId, status: '1' }).populate({
            path: 'from',
            select: 'id name profile'
        });
        requests.forEach(request => {
            userList.push(request.from);
        })
        return userList;
    } catch (error) {
        throw error; // Propagate the error for handling at a higher level
    }
}
async function updateRequestStatus(from, to, status) {
    try {
        // Find the friend request with the given from and to users
        const friendRequest = await FriendRequest.findOne({ from, to, status: '1' });

        if (!friendRequest) {
            throw new Error('Friend request not found');
        }

        // Update the status
        friendRequest.status = status;
        await friendRequest.save();
        if (status == '2') {
            await addFriendToUser(to, from);
        }
        return friendRequest;
    } catch (error) {
        throw error; // Propagate the error for handling at a higher level
    }
}
module.exports = {
    sendFriendRequest,
    getRecivedRequestCount,
    getRecivedRequests,
    updateRequestStatus
}