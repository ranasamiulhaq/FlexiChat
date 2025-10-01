import { createSecretToken } from "../utils/secretToken.js";
import UserModel from "../models/userModel.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

// Function to handle sending the cookie and JSON response
const sendAuthResponse = (res, token, user, message, statusCode) => {
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
        maxAge: 60 * 60 * 1000
    });
    res.status(statusCode).json({
        message: message,
        success: true,
        token: token, // <-- Send the token in the body
        user: {
            id: user._id,
            username: user.username,
            email: user.email
        }
    });
};

export const SignUp = async (req,res)=>{
    try{
        const { username, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12);

        const existingUser = await UserModel.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ success: false, message: "User Already Exists" });
        }

        const user = await UserModel.create({username,email,password:hashedPassword,createdAt: new Date()});
        
        const token = createSecretToken(user._id);

        sendAuthResponse(res, token, user, "Account Created Successfully", 201);
    }
    catch(error){
        res.status(500).json({success:false, message:error.message});
    }
}

export const Login = async(req,res)=> {
    try{
        console.log("In login route");
        const {email , password} = req.body;

        const loginUser = await UserModel.findOne({email});

        if(!loginUser){
            return res.json({success:false,message : "Incorrect Email or Email Don't Exists"});
        }

        const isPassValid = await bcrypt.compare(password,loginUser.password);
        if(!isPassValid){
            return res.json({success:false,message : "Password Incorrect"});
        }

        const token = createSecretToken(loginUser._id);
        
        sendAuthResponse(res, token, loginUser, "Login Successful", 200);
    }
    catch(error){
        res.status(500).json({success:false,message:error.message});
    }
}

export const UserVerification = async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ status: false });
        }

        jwt.verify(token, process.env.TOKEN_KEY, async (error, data) => {
            if (error) {
                return res.json({ status: false });
            } else { 
                const user = await UserModel.findById(data.id);
                if (user) {
                    const newToken = createSecretToken(user._id); // Generate a new token
                    res.cookie("token", newToken, { // Set a new HttpOnly cookie
                        httpOnly: true,
                        secure: true,
                        sameSite: "Strict",
                        maxAge: 60 * 60 * 1000
                    });

                    return res.json({
                        status: true,
                        user: {
                            id: user._id,
                            username: user.username,
                            email: user.email 
                        },
                        token: newToken // <-- Add the token to the body
                    });
                } 
                else {
                    return res.json({ status: false });
                }
            }
        });
    } catch (err) {
        console.error("Verification error:", err);
        return res.json({ status: false });
    }
};


export const Logout = (req, res) => {
    res.clearCookie('token'); 
    res.status(200).json({ message: "Logged out successfully" });
};