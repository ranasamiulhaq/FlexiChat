Here’s a polished **README.md** for your project based on the text you provided:

---

# FlexiChat: MERN Real-Time Chat Application

A full-stack, real-time chat application built for instant communication. FlexiChat utilizes the **MERN stack** and **WebSockets** to deliver a fast, secure, and modern messaging experience.

---

## Features

* **Real-Time Messaging** – Instant, low-latency communication powered by WebSockets (Socket.IO).
* **Live Status Indicators** – Online/Offline status and typing indicators for active users.
* **Secure Authentication** – JSON Web Tokens (JWTs) for robust security.
* **HTTP-Only Cookies** – Authentication tokens stored in secure, HTTP-only cookies.
* **Persistent Storage** – All chat messages and user data stored in MongoDB.
* **Full-Stack Architecture** – Clear separation between the React frontend and the Express/Node.js backend.

---

## Technology Stack

| Category      | Technology             | Description                                              |
| ------------- | ---------------------- | -------------------------------------------------------- |
| **Frontend**  | React                  | JavaScript library for building user interfaces.         |
| **Backend**   | Node.js & Express.js   | Runtime environment + fast, unopinionated web framework. |
| **Database**  | MongoDB                | NoSQL database for chat history & user data.             |
| **Real-Time** | WebSockets (Socket.IO) | Enables bi-directional, real-time communication.         |
| **Auth**      | JWT                    | JSON Web Tokens for secure, stateless authentication.    |

---

## Getting Started

Follow these steps to set up and run **FlexiChat** locally.

### Prerequisites

Make sure you have installed:

* **Node.js** (with npm or yarn)
* **MongoDB** (local installation or [MongoDB Atlas](https://www.mongodb.com/atlas))

---

### 1. Clone the Repository

```bash
git clone https://github.com/ranasamiulhaq/FlexiChat.git
cd FlexiChat
```

---

### 2. Configure Environment Variables

Create a `.env` file inside the **backend** directory:

```env
# MongoDB Connection String
MONGO_URI=your_mongodb_connection_string

# JWT Secret Key
JWT_SECRET=a_strong_secret_key

# Cookie Configuration
NODE_ENV=development # or production
PORT=5000 # Backend port
```

---

### 3. Setup the Backend

```bash
cd backend
npm install
npm start
# Backend runs at http://localhost:5000
```

---

### 4. Setup the Frontend

```bash
cd ../frontend
npm install
npm start
# React app runs at http://localhost:3000
```

---

## Usage

1. **Register** – Create a new account with username & password.
2. **Login** – Authenticate with your credentials.
3. **Chat** – Start messaging instantly with other registered users.
4. **Observe Status** – See who’s online and when they are typing.

---

## Troubleshooting

* **MongoDB connection error** → Check your `MONGO_URI` in `.env`.
* **Port conflicts** → Change `PORT` in `.env` or stop any service using `5000/3000`.
* **Frontend not loading** → Make sure backend is running before starting frontend.

---

## Contributors

* [@ranasamiulhaq](https://github.com/ranasamiulhaq) – Creator & Maintainer

---

## License

This project is open-source. Check the repository for a specific license file (e.g., **MIT**, **GPL**).
If no license file is present, assume **all rights reserved** by the author.

---

Do you want me to also include **badges** (for build status, license, technologies) at the top to make it look more professional?
