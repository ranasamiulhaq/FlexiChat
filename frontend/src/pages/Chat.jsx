    import { useState, useEffect, useRef } from "react";
import { Send, LogOut, MessageCircle, Users, Search, MoreVertical, Phone, Video } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const Chat = () => {
    const navigate = useNavigate();
    
    // Auth and navigation states
    const [message, setMessage] = useState("Auth Successful / Logged In");
    const [showModal, setShowModal] = useState(false);
    
    // User management states
    const [users, setUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [onlineUsers, setOnlineUsers] = useState(new Set());
    const [userStatuses, setUserStatuses] = useState(new Map());
    
    // Chat states
    const [selectedUser, setSelectedUser] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [socket, setSocket] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState(new Set());
    const [currentConversationId, setCurrentConversationId] = useState(null);
    
    // Refs
    const messagesEndRef = useRef(null);
    const messageInputRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

    // Auto scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatMessages]);

    // Initialize app with your backend
    useEffect(() => {
        const verifyUser = async () => {
            try {
                // Verify and get current user
                const res = await axios.post(
                    `${BACKEND_URL}/auth/userVerification`,
                    {},
                    { withCredentials: true }
                );

                if (!res.data.status) {
                    navigate("/login");
                    return;
                }

                // Save current user data
                const userData = res.data.user;
                setCurrentUser(userData);

                // Initialize Socket.IO connection AFTER getting user data
                const socketConnection = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5050", {
                    withCredentials: true
                });

                setSocket(socketConnection);

                // Join user to their own room with user data
                socketConnection.emit('join', userData);

                // Listen for incoming messages
                socketConnection.on('receive_message', (data) => {
                    setChatMessages(prev => [...prev, data]);
                });

                // Listen for sent message confirmation (for sender)
                socketConnection.on('message_sent', (data) => {
                    setChatMessages(prev => [...prev, data]);
                    // Store conversation ID for future reference
                    if (data.conversationId) {
                        setCurrentConversationId(data.conversationId);
                    }
                });

                // Listen for message errors
                socketConnection.on('message_error', (error) => {
                    console.error('Message error:', error);
                });

                // Listen for online users updates
                socketConnection.on('online_users_updated', (onlineUsersList) => {
                    const onlineUserIds = new Set(onlineUsersList.map(user => user._id));
                    const statusMap = new Map(onlineUsersList.map(user => [user._id, user]));
                    
                    setOnlineUsers(onlineUserIds);
                    setUserStatuses(statusMap);
                    
                    console.log('Online users updated:', onlineUsersList);
                });

                // Listen for individual user status changes
                socketConnection.on('user_status_changed', (statusData) => {
                    const { userId, status, userInfo } = statusData;
                    
                    setOnlineUsers(prev => {
                        const newSet = new Set(prev);
                        if (status === 'online') {
                            newSet.add(userId);
                        } else {
                            newSet.delete(userId);
                        }
                        return newSet;
                    });

                    if (userInfo) {
                        setUserStatuses(prev => {
                            const newMap = new Map(prev);
                            newMap.set(userId, userInfo);
                            return newMap;
                        });
                    }

                    // Update the users list with new status
                    setUsers(prevUsers => 
                        prevUsers.map(user => 
                            user._id === userId 
                                ? { ...user, status: status }
                                : user
                        )
                    );

                    // Update selected user if it's the one whose status changed
                    setSelectedUser(prevSelected => 
                        prevSelected && prevSelected._id === userId 
                            ? { ...prevSelected, status: status }
                            : prevSelected
                    );
                    
                    console.log(`User ${userId} is now ${status}`);
                });

                // Listen for typing indicators
                socketConnection.on('user_typing', (data) => {
                    const { userId, isTyping } = data;
                    setTypingUsers(prev => {
                        const newSet = new Set(prev);
                        if (isTyping) {
                            newSet.add(userId);
                        } else {
                            newSet.delete(userId);
                        }
                        return newSet;
                    });
                });

                // Fetch all users
                const usersRes = await axios.get(
                    `${BACKEND_URL}/chat/users`,
                    { withCredentials: true }
                );

                // Filter out the current user and set initial status
                const filteredUsers = usersRes.data.filter(
                    (u) => u.email !== userData.email
                ).map(user => ({
                    ...user,
                    status: 'offline' // Default to offline, will be updated by socket events
                }));

                setUsers(filteredUsers);

            } catch (error) {
                console.error("Verification error:", error);
                navigate("/login");
            }
        };

        verifyUser();

        // Cleanup socket connection on unmount
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [navigate, BACKEND_URL]);

    // Handle typing indicators
    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        
        if (selectedUser && socket) {
            // Clear existing timeout
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            
            // Send typing start
            socket.emit('typing_start', { receiverId: selectedUser._id });
            
            // Set timeout to send typing stop
            typingTimeoutRef.current = setTimeout(() => {
                socket.emit('typing_stop', { receiverId: selectedUser._id });
            }, 1000);
        }
    };

    // Filter users based on search and categorize by online status
    const filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const onlineFilteredUsers = filteredUsers.filter(user => onlineUsers.has(user._id));
    const offlineFilteredUsers = filteredUsers.filter(user => !onlineUsers.has(user._id));

    // Handle user selection - Updated for conversation model
// Handle user selection - Updated for conversation model
// Handle user selection - Updated for conversation model
    const handleUserSelect = async (user) => {
        setSelectedUser(user);
        setChatMessages([]); // Clear previous messages
        setTypingUsers(new Set()); // Clear typing indicators
        setCurrentConversationId(null); // Reset conversation ID

        // Make sure currentUser is available
        if (!currentUser) {
            console.error("Current user not loaded yet");
            return;
        }

        try {
            // Debug: Check currentUser structure
            console.log('Current user object:', currentUser);
            console.log('Selected user object:', user);
            
            // Get the correct user ID - check all possible properties
            const currentUserId = currentUser._id || currentUser.id;
            const selectedUserId = user._id || user.id;
            
            console.log('Current user ID:', currentUserId);
            console.log('Selected user ID:', selectedUserId);
            
            if (!currentUserId || !selectedUserId) {
                console.error('Missing user IDs:', { currentUserId, selectedUserId });
                return;
            }
            
            console.log(`Making API call to load messages between ${currentUserId} and ${selectedUserId}`);
            
            // The backend will now return messages from the conversation model
            const res = await axios.get(
                `${BACKEND_URL}/chat/messages/${currentUserId}/${selectedUserId}`,
                { withCredentials: true }
            );
            
            console.log('API Response:', res.data);
            console.log('API Response length:', res.data.length);
            
            // Messages are now returned directly from the conversation's messages array
            setChatMessages(res.data);
            
            console.log(`Loaded ${res.data.length} messages from conversation`);
        } catch (error) {
            console.error("Error loading chat history:", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
        }
    };

    // Send message function - Updated for conversation model
    const sendMessage = () => {
        if (!newMessage.trim() || !selectedUser || !currentUser) return;

        // Clear typing timeout and send typing stop
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        if (socket && selectedUser) {
            socket.emit('typing_stop', { receiverId: selectedUser._id });
        }

        const messageData = {
            sender: currentUser._id || currentUser.id,
            receiver: selectedUser._id,
            message: newMessage,
            timestamp: new Date()
        };

        // Send message through socket - backend will handle conversation logic
        socket.emit('send_message', messageData);

        // Clear input
        setNewMessage("");
        messageInputRef.current?.focus();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleLogout = async () => {
        try {
            if (socket) {
                socket.disconnect();
            }
            await axios.post(`${BACKEND_URL}/auth/logout`, {}, { withCredentials: true });
            setMessage("You have been logged out successfully.");
            setShowModal(true);
            setTimeout(() => {
                navigate('/login');
            }, 1000);
        } catch (error) {
            setMessage("An error occurred during logout.");
            setShowModal(true);
            console.error("Logout failed:", error);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'away': return 'bg-yellow-500';
            case 'busy': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    const isUserOnline = (userId) => {
        return onlineUsers.has(userId);
    };

    const getAvatarText = (user) => {
        if (user.username) {
            return user.username.split(' ').map(name => name[0]).join('').substring(0, 2).toUpperCase();
        }
        return user.email.substring(0, 2).toUpperCase();
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) return 'Today';
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const isYesterday = date.toDateString() === yesterday.toDateString();
        
        if (isYesterday) return 'Yesterday';
        
        return date.toLocaleDateString();
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                <div className="flex flex-col items-center space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-300">Loading your chat...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
            {/* Users Sidebar */}
            <div className="w-80 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 flex flex-col">
                {/* Sidebar Header */}
                <div className="p-6 border-b border-gray-700/50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                                <MessageCircle size={20} />
                            </div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                Chat
                            </h2>
                        </div>
                        <button 
                            onClick={handleLogout}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-all duration-200 group"
                            title="Logout"
                        >
                            <LogOut size={18} className="group-hover:text-red-400" />
                        </button>
                    </div>
                    
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-gray-700 text-white placeholder-gray-400 transition-all duration-200"
                        />
                    </div>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-2">
                        {/* Online Users Section */}
                        {onlineFilteredUsers.length > 0 && (
                            <div className="mb-4">
                                <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-400">
                                    <span>ONLINE ({onlineFilteredUsers.length})</span>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <Users size={14} />
                                    </div>
                                </div>
                                
                                {onlineFilteredUsers.map((user) => (
                                    <div 
                                        key={user._id} 
                                        onClick={() => currentUser ? handleUserSelect(user) : null}
                                        className={`p-4 cursor-pointer rounded-lg mx-2 mb-1 transition-all duration-200 hover:bg-gray-700/50 group ${
                                            selectedUser?._id === user._id ? 'bg-blue-600/20 border border-blue-500/30' : ''
                                        } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {getAvatarText(user)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor('online')} border-2 border-gray-800 rounded-full`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate group-hover:text-white transition-colors">
                                                    {user.username || user.email}
                                                </div>
                                                <div className="text-sm text-green-400">
                                                    online
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Offline Users Section */}
                        {offlineFilteredUsers.length > 0 && (
                            <div>
                                <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-400">
                                    <span>OFFLINE ({offlineFilteredUsers.length})</span>
                                    <div className="flex items-center space-x-1">
                                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                                        <Users size={14} />
                                    </div>
                                </div>
                                
                                {offlineFilteredUsers.map((user) => (
                                    <div 
                                        key={user._id} 
                                        onClick={() => currentUser ? handleUserSelect(user) : null}
                                        className={`p-4 cursor-pointer rounded-lg mx-2 mb-1 transition-all duration-200 hover:bg-gray-700/50 group ${
                                            selectedUser?._id === user._id ? 'bg-blue-600/20 border border-blue-500/30' : ''
                                        } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold opacity-70">
                                                    {getAvatarText(user)}
                                                </div>
                                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor('offline')} border-2 border-gray-800 rounded-full`}></div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium truncate group-hover:text-white transition-colors opacity-70">
                                                    {user.username || user.email}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    offline
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-6 bg-gray-800/30 backdrop-blur-sm border-b border-gray-700/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="relative">
                                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                            {getAvatarText(selectedUser)}
                                        </div>
                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${getStatusColor(isUserOnline(selectedUser._id) ? 'online' : 'offline')} border-2 border-gray-800 rounded-full`}></div>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">
                                            {selectedUser.username || selectedUser.email}
                                        </h3>
                                        <p className="text-sm text-gray-400 capitalize">
                                            {isUserOnline(selectedUser._id) ? (
                                                <span className="text-green-400">online</span>
                                            ) : (
                                                <span>offline</span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                

                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-900/20">
                            {chatMessages.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center text-gray-400">
                                        <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="text-lg">No messages yet</p>
                                        <p className="text-sm">Start a conversation with {selectedUser.username || selectedUser.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {chatMessages.map((msg, index) => {
                                        // Handle both ObjectId and string comparison for sender
                                        const msgSenderId = typeof msg.sender === 'object' ? msg.sender._id : msg.sender;
                                        const currentUserId = currentUser._id || currentUser.id;
                                        const isCurrentUser = msgSenderId === currentUserId;
                                        
                                        const showDate = index === 0 || formatDate(msg.timestamp) !== formatDate(chatMessages[index - 1]?.timestamp);
                                        
                                        return (
                                            <div key={msg._id || index}>
                                                {showDate && (
                                                    <div className="flex justify-center my-4">
                                                        <span className="px-3 py-1 bg-gray-700/50 rounded-full text-xs text-gray-400">
                                                            {formatDate(msg.timestamp)}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                                                        isCurrentUser
                                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-md' 
                                                            : 'bg-gray-700/80 text-white rounded-bl-md'
                                                    } shadow-lg`}>
                                                        <div className="text-sm leading-relaxed">{msg.message}</div>
                                                        <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-100' : 'text-gray-400'}`}>
                                                            {formatTime(msg.timestamp)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={messagesEndRef} />
                                </>
                            )}
                        </div>

                        {/* Message Input */}
                        <div className="p-6 bg-gray-800/30 backdrop-blur-sm border-t border-gray-700/50">
                            <div className="flex items-end space-x-4">
                                <div className="flex-1 relative">
                                    <textarea
                                        ref={messageInputRef}
                                        value={newMessage}
                                        onChange={handleInputChange}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        rows="1"
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-gray-700 text-white placeholder-gray-400 resize-none transition-all duration-200 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
                                        style={{ minHeight: '44px', maxHeight: '120px' }}
                                        onInput={(e) => {
                                            e.target.style.height = 'auto';
                                            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                        }}
                                    />
                                </div>
                                <button
                                    onClick={sendMessage}
                                    disabled={!newMessage.trim()}
                                    className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            {/* Typing Indicator */}
                            {typingUsers.has(selectedUser._id) && (
                                <div className="flex items-center space-x-2 mt-2 text-sm text-gray-400">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span>{selectedUser.username || selectedUser.email} is typing...</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // No user selected state
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                            <div className="w-24 h-24 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <MessageCircle size={48} className="text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-semibold mb-2 text-white">Welcome to Chat</h3>
                            <p className="text-lg mb-6">Connect with your friends and colleagues</p>
                            <div className="flex items-center justify-center space-x-8 text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                    <span>Secure</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span>Real-time</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                    <span>Modern</span>
                                </div>
                            </div>
                            {onlineUsers.size > 0 && (
                                <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                                    <p className="text-sm text-gray-300 mb-2">
                                        {onlineUsers.size} {onlineUsers.size === 1 ? 'person is' : 'people are'} online
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        Select a user from the sidebar to start chatting
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal for messages */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-gray-800 border border-gray-700 text-white p-8 rounded-2xl shadow-2xl max-w-md mx-4 transform transition-all duration-300 scale-100">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogOut size={24} className="text-white" />
                            </div>
                            <p className="text-lg">{message}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Chat;