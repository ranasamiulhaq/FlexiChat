// controllers/chatController.js
import UserModel from "../models/userModel.js";
import Conversation from "../models/conversationModel.js";
import mongoose from 'mongoose';

export const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.find({ _id: { $ne: req.user.id } }).select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getMessages = async (req, res) => {
    try {
        const { user1, user2 } = req.params;
        
        console.log('=== DEBUG getMessages ===');
        console.log('Raw params - user1:', user1, 'user2:', user2);
        console.log('user1 type:', typeof user1, 'user2 type:', typeof user2);
        
        // Validate ObjectId format first
        if (!mongoose.Types.ObjectId.isValid(user1) || !mongoose.Types.ObjectId.isValid(user2)) {
            console.log('Invalid ObjectId format');
            return res.status(400).json({ message: 'Invalid user ID format' });
        }
        
        // Convert string IDs to ObjectIds
        const user1ObjectId = new mongoose.Types.ObjectId(user1);
        const user2ObjectId = new mongoose.Types.ObjectId(user2);
        
        console.log('Converted ObjectIds - user1:', user1ObjectId, 'user2:', user2ObjectId);
        
        // First, let's check if any conversations exist at all
        const allConversations = await Conversation.find({}).lean();
        console.log('Total conversations in database:', allConversations.length);
        
        // Check conversations involving these users
        const conversationsWithUser1 = await Conversation.find({
            participants: user1ObjectId
        }).lean();
        
        const conversationsWithUser2 = await Conversation.find({
            participants: user2ObjectId
        }).lean();
        
        console.log(`Conversations with user1 (${user1}):`, conversationsWithUser1.length);
        console.log(`Conversations with user2 (${user2}):`, conversationsWithUser2.length);
        
        // Find conversation between the two users
        const conversation = await Conversation.findBetweenUsers(user1ObjectId, user2ObjectId)
            .populate('messages.sender', 'username email')
            .lean();
        
        console.log('findBetweenUsers result:', conversation ? 'Found' : 'Not found');
        
        if (!conversation) {
            console.log('No conversation found between users - returning empty array');
            return res.json([]);
        }

        console.log(`Found conversation with ${conversation.messages.length} messages`);
        console.log('Conversation ID:', conversation._id);
        console.log('Participants:', conversation.participants);
        
        // Return just the messages array
        res.json(conversation.messages);
    } catch (err) {
        console.error('Error loading messages:', err);
        res.status(500).json({ message: err.message });
    }
};

// New function to get user's conversations list
export const getUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const conversations = await Conversation.find({
            participants: userId
        })
        .populate('participants', 'username email')
        .populate('lastMessage.sender', 'username')
        .sort({ lastActivity: -1 })
        .lean();

        res.json(conversations);
    } catch (err) {
        console.error('Error loading conversations:', err);
        res.status(500).json({ message: err.message });
    }
};

// Function to mark messages as read
export const markMessagesAsRead = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user.id;
        
        await Conversation.updateOne(
            { _id: conversationId },
            { 
                $set: { 
                    "messages.$[elem].isRead": true 
                } 
            },
            { 
                arrayFilters: [{ 
                    "elem.sender": { $ne: userId },
                    "elem.isRead": false 
                }] 
            }
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error marking messages as read:', err);
        res.status(500).json({ message: err.message });
    }
};