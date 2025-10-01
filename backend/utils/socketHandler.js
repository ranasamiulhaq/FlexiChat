import { Server } from 'socket.io';
import Conversation from '../models/conversationModel.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const onlineUsers = new Map(); // userId -> { socketId, userInfo }

const initializeSocketIO = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:5173" || "http://192.168.1.35:5173",
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        console.log('User connected:', socket.id);

        socket.on('join', (userData) => {
            const userId = userData._id || userData.id;
            
            onlineUsers.set(userId, {
                socketId: socket.id,
                userInfo: {
                    _id: userId,
                    username: userData.username,
                    email: userData.email,
                    status: 'online'
                }
            });

            socket.join(userId);
            
            socket.userId = userId;

            console.log(`User ${userData.username || userData.email} (${userId}) joined room`);

            socket.broadcast.emit('user_status_changed', {
                userId: userId,
                status: 'online',
                userInfo: onlineUsers.get(userId).userInfo
            });

            const onlineUsersList = Array.from(onlineUsers.values()).map(user => user.userInfo);
            socket.emit('online_users_updated', onlineUsersList);

            console.log('Current online users:', onlineUsersList.length);
        });

        socket.on('send_message', async (messageData) => {
            try {
                const { sender, receiver, message } = messageData;
                
                console.log(`Sending message from ${sender} to ${receiver}`);
                
                const senderObjectId = new mongoose.Types.ObjectId(sender);
                const receiverObjectId = new mongoose.Types.ObjectId(receiver);
                
                // Find conversation between users
                let conversation = await Conversation.findBetweenUsers(senderObjectId, receiverObjectId);
                
                if (!conversation) {
                    conversation = new Conversation({
                        participants: [senderObjectId, receiverObjectId],
                        messages: []
                    });
                }

                await conversation.addMessage(senderObjectId, message);

                // Get latest message (last in array)
                const newMessage = conversation.messages[conversation.messages.length - 1];

                const messageToSend = {
                    _id: newMessage._id,
                    sender: newMessage.sender,
                    receiver: receiver,
                    message: newMessage.message,
                    timestamp: newMessage.timestamp,
                    conversationId: conversation._id
                };

                const receiverInfo = onlineUsers.get(receiver);
                
                // Send to receiver only if they're online
                if (receiverInfo) {
                    console.log(`Sending receive_message to receiver socket: ${receiverInfo.socketId}`);
                    io.to(receiverInfo.socketId).emit('receive_message', messageToSend);
                } else {
                    console.log(`Receiver ${receiver} is not online, message saved but not delivered in real-time`);
                }
                
                // Send confirmation back to sender only
                console.log(`Sending message_sent confirmation to sender socket: ${socket.id}`);
                socket.emit('message_sent', messageToSend);

                console.log('Message sent and saved to conversation:', messageToSend);
            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('message_error', { error: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data) => {
            const receiverInfo = onlineUsers.get(data.receiverId);
            if (receiverInfo) {
                io.to(receiverInfo.socketId).emit('user_typing', {
                    userId: socket.userId,
                    isTyping: true
                });
            }
        });

        socket.on('typing_stop', (data) => {
            const receiverInfo = onlineUsers.get(data.receiverId);
            if (receiverInfo) {
                io.to(receiverInfo.socketId).emit('user_typing', {
                    userId: socket.userId,
                    isTyping: false
                });
            }
        });

        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
            
            if (socket.userId) {
                // Remove user from online users
                onlineUsers.delete(socket.userId);
                
                // Broadcast to all clients that this user is now offline
                socket.broadcast.emit('user_status_changed', {
                    userId: socket.userId,
                    status: 'offline'
                });

                console.log(`User ${socket.userId} went offline`);
                console.log('Remaining online users:', onlineUsers.size);
            }
        });

        // Handle manual status updates (if needed)
        socket.on('update_status', (statusData) => {
            if (socket.userId && onlineUsers.has(socket.userId)) {
                const userInfo = onlineUsers.get(socket.userId).userInfo;
                userInfo.status = statusData.status;
                
                // Broadcast status change to all other users
                socket.broadcast.emit('user_status_changed', {
                    userId: socket.userId,
                    status: statusData.status,
                    userInfo: userInfo
                });
            }
        });

        // Optional: Handle getting online users list (for debugging or refresh)
        socket.on('get_online_users', () => {
            const onlineUsersList = Array.from(onlineUsers.values()).map(user => user.userInfo);
            socket.emit('online_users_updated', onlineUsersList);
        });
    });

    return io;
};

export default initializeSocketIO;