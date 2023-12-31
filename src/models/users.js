const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    personalId: {
        type: String,
        required: true
    },
    profile: {
        type: String,
        required: true
    },
    friends: [
        {
            personalId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
            lastReadMessage: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Message',
            },
        },
    ],
    lastOnline: {
        type: Date,
        default: () => new Date()
    },
    onlineStatus: {
        type: Number,
        enum: [0, 1], // 0 for offline and 1 for online
        default: 0
    }
}, {
    timestamps: true
})

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error('Unable to login')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if (!isMatch) {
        throw new Error('Unable to login')
    }
    return user
}

// Hash the plain text password before saving
userSchema.pre('save', async function (next) {
    const user = this

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User