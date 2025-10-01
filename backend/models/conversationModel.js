// models/conversationModel.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel',
        required: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { _id: true }); // Keep _id for individual messages if needed

const ConversationSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModel',
        required: true
    }],
    messages: [MessageSchema],
    lastMessage: {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserModel'
        },
        message: String,
        timestamp: Date
    },
    lastActivity: {
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for efficient queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ "participants": 1, "lastActivity": -1 });

// Method to find conversation between two users
ConversationSchema.statics.findBetweenUsers = function(user1Id, user2Id) {
    return this.findOne({
        participants: { $all: [user1Id, user2Id], $size: 2 }
    });
};

// Method to add a message to conversation
ConversationSchema.methods.addMessage = function(senderId, messageText) {
    const newMessage = {
        sender: senderId,
        message: messageText,
        timestamp: new Date()
    };
    
    this.messages.push(newMessage);
    this.lastMessage = {
        sender: senderId,
        message: messageText,
        timestamp: newMessage.timestamp
    };
    this.lastActivity = new Date();
    
    return this.save();
};

const Conversation = mongoose.model("Conversation", ConversationSchema);
export default Conversation;