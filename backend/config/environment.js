import dotenv from 'dotenv';

// Load environment based on NODE_ENV
const env = process.env.NODE_ENV || 'development';
dotenv.config({ path: `.env.${env}` });

export const config = {
    port: process.env.PORT || 5050,
    mongoUrl: process.env.MONGO_URL,
    tokenKey: process.env.TOKEN_KEY,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    frontendUrl: process.env.FRONTEND_URL,
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || [],
    nodeEnv: env,
    logLevel: process.env.LOG_LEVEL || 'info',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
    cookieSameSite: process.env.COOKIE_SAME_SITE || 'Strict'
};