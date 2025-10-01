import { SignUp , Login ,UserVerification, Logout } from "../controllers/authController.js";
import express from 'express';

const authRouter = express.Router();

authRouter.post("/signup",SignUp);
authRouter.post("/login",Login);
authRouter.post("/logout",Logout);
authRouter.post("/userVerification",UserVerification);


export default authRouter;