# Tutor Together

## Introduction

Tutor Together is a full-stack web application that connects students with qualified tutors for online tutoring sessions. The platform streamlines the process of finding tutors, booking sessions, and managing educational interactions.

## Objective

- Provide students easy access to qualified tutors across various subjects
- Enable tutors to manage their availability and grow their tutoring business
- Facilitate seamless communication between students and tutors
- Offer AI-powered assistance for quick academic help

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19, Vite, Tailwind CSS, React Router DOM |
| **Backend** | Node.js, Express.js, JWT Authentication |
| **Database** | PostgreSQL |
| **Real-time** | Socket.io |
| **AI Integration** | Groq API (LLaMA 3.3) |

---

## Features

### Student Features
- Search and browse tutors by subject, rating, and availability
- Book tutoring sessions with preferred tutors
- View upcoming and past sessions
- Real-time messaging with tutors
- AI chatbot for instant academic help
- Rate and review completed sessions
- Personal calendar for session tracking

### Tutor Features
- Create and manage professional profile
- Set weekly availability schedule
- Accept or reject booking requests
- View and manage sessions
- Track earnings and session history
- Communicate with students via messaging
- Mark sessions as completed

### Admin Features
- Dashboard with platform statistics
- Approve or reject tutor applications
- Monitor all sessions on the platform
- Manage user accounts
- View platform earnings and reports

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+

### Installation

```bash
git clone https://github.com/kishorekumarsunke/Sunke_Vasan_Varpe_Varadaraju.git
cd Sunke_Vasan_Varpe_Varadaraju

npm run install:all

cp backend/.env.example backend/.env
# Configure your database credentials in backend/.env

cd backend
npm run db:init
npm run db:seed
cd ..

npm run dev
```

### Running the App

```bash
npm run dev      # Frontend & Backend
npm run fe       # Frontend only (localhost:3001)
npm run be       # Backend only (localhost:5000)
```

---

## Environment Variables

Create `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=TutorTogether
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3001
GROK_API_KEY=your_groq_api_key
```

---

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/auth` | User authentication |
| `/api/tutors` | Tutor listings |
| `/api/booking` | Session booking |
| `/api/messages` | Messaging |
| `/api/reviews` | Reviews |
| `/api/ai-chat` | AI chatbot |
| `/api/admin` | Admin panel |

---

## Deployment

- **Frontend:** https://kxs0089.uta.cloud
- **Backend:** Render 
- **Database:** Neon PostgreSQL

---

## Team

- Vasan Chandrasekar - 1002268412
- Sunke Kishore Kumar - 1002190089
- Varpe Pranav – 1002190680
- Varadaraju Rahul - 1002228075

