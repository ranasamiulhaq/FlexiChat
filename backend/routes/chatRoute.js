// routes/chatRoute.js
import express from "express";
import { 
    getAllUsers,
    getMessages,
    getUserConversations,
    markMessagesAsRead
} from "../controllers/chatController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/users", verifyToken, getAllUsers);
router.get("/messages/:user1/:user2", verifyToken, getMessages);
router.get("/conversations", verifyToken, getUserConversations);
router.put("/conversations/:conversationId/read", verifyToken, markMessagesAsRead);

export default router;