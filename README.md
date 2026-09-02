# 🚍 GoCampus - Smart University Bus Tracking

![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)
![React](https://img.shields.io/badge/Frontend-React%20%7C%20Vite-61DAFB.svg)
![Socket.io](https://img.shields.io/badge/RealTime-Socket.io-black.svg)
![Tailwind](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC.svg)

GoCampus is a modern, real-time university transit tracking application. It bridges the gap between campus administration, drivers, and students by providing a seamless interface to track university buses in real-time.

## 🚀 Features

*   **Real-Time Bus Tracking:** Leverages WebSockets (`Socket.io`) to stream exact geographical coordinates from drivers to students with sub-second latency.
*   **Role-Based Access Control:** Secure, customized dashboard interfaces for three distinct roles: 
    *   **Students:** View live bus maps, check available seats dynamically, and receive critical push notifications.
    *   **Drivers:** Easy-to-use console to increment/decrement active seat counts and passively broadcast GPS locations.
    *   **Administrators:** A command center to manage fleet operations, assign routes, and dispatch system-wide alerts.
*   **Live Notifications:** A fully synchronized global notification engine with a glowing bell indicator for unread alerts.
*   **Responsive Design:** Fully optimized layout ensuring a flawless experience across all mobile devices, tablets, and desktop viewports.

## 💻 Tech Stack

### Frontend
*   **React 19** & **Vite**
*   **Tailwind CSS** (Fully Responsive Design)
*   **React-Leaflet** (Map Rendering)
*   **Socket.io-Client** (Real-Time Subscriptions)

### Backend
*   **Node.js** & **Express**
*   **MongoDB** & **Mongoose**
*   **Socket.io** (Real-Time Broadcasting)
*   **JWT** (Authentication) & **Bcrypt** (Password Hashing)

---

## 🛠️ Getting Started

Follow these instructions to run the application locally.

### Prerequisites
*   [Node.js](https://nodejs.org/en/) (v18+)
*   [MongoDB](https://www.mongodb.com/try/download/community) (Running locally on port 27017 or a MongoDB Atlas URI)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/ANKITJOSHI1605/GoCampus.git
    cd GoCampus
    ```

2.  **Install dependencies**
    ```bash
    # Install backend dependencies
    cd backend
    npm install
    
    # Install frontend dependencies
    cd ../frontend
    npm install
    ```

3.  **Seed the Database** (Optional but recommended for testing)
    This will generate test accounts and initial bus routes.
    ```bash
    cd backend
    npm run seed
    ```

4.  **Run the Application**
    Open two terminals and start both servers concurrently.
    
    **Terminal 1 (Backend):**
    ```bash
    cd backend
    npm run dev
    ```

    **Terminal 2 (Frontend):**
    ```bash
    cd frontend
    npm run dev
    ```

### 🔑 Demo Credentials
If you have seeded the database, you can log in with the following credentials (Password is `123456` for all):
*   `admin@gocampus.com`
*   `driver@gocampus.com`
*   `student@gocampus.com`

---

## Environment variables

Copy the supplied `.env.example` files and provide your own MongoDB, JWT and mapping credentials. Never commit real secrets.

*Built for Graphic Era Hill University* 🎓
