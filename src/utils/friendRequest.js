require('../db/mongoose')
const FriendRequest = require('../models/friendRequest')

const sendFriendRequest = async (senderId, receiverId) => {
    try {
        // Check if a friend request already exists with the same sender and receiver
        const existingRequest = await FriendRequest.findOne({ from: senderId, to: receiverId });

        if (existingRequest) {      // Friend request already exists.
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
        console.error("Error counting received accepted requests:", error);
        throw error; // Propagate the error for handling at a higher level
    }
}
async function getRecivedRequests(userId) {
    try {
        const requests = await FriendRequest.find({ to: userId }).populate({
            path: 'from',
            select: 'id name profile'
        });
        return requests;
    } catch (error) {
        console.error("Error getting received friend requests:", error);
        throw error; // Propagate the error for handling at a higher level
    }
}
module.exports = {
    sendFriendRequest,
    getRecivedRequestCount,
    getRecivedRequests
}