import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const createSecretToken = (id) => {
    return jwt.sign(
        { id },
        process.env.TOKEN_KEY,
        { expiresIn: process.env.TOKEN_EXPIRY || '15m' } 
    );
};

export const createRefreshToken = (id) => {
    return jwt.sign(
        { id, type: 'refresh' },
        process.env.REFRESH_TOKEN_KEY,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
    );
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_TOKEN_KEY);
};
  