# Tutor Together

A comprehensive online tutoring platform with a React frontend and Node.js backend.

## Project Structure

This is a monorepo containing both frontend and backend applications:

```
Tutor_Together/
├── frontend/          # React application (Vite + Tailwind CSS)
├── backend/           # Node.js API server (Express + MongoDB)
├── docs/             # Database design and documentation
├── README.md         # This file
└── .gitignore        # Git ignore rules
```

## Quick Start

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3001`

### Backend Development

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

The backend API will be available at `http://localhost:5000`

## Frontend

The frontend is built with:

- **React 19** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - Client-side routing

### Frontend Features

- User authentication and authorization
- Student and tutor dashboards
- Booking system
- Real-time messaging
- AI chatbot integration
- Responsive design

### Frontend Deployment

#### GitHub Pages

```bash
cd frontend
npm run deploy:github
```

#### UTA Cloud

```bash
cd frontend
npm run build:uta
# Upload dist/ contents to public_html
```

## Backend

The backend is built with:

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens

### Backend Features

- RESTful API design
- User authentication with JWT
- Password hashing with bcrypt
- Rate limiting and security headers
- Input validation and sanitization
- Email notifications

## Development Workflow

1. **Start Backend** (Terminal 1):

   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend** (Terminal 2):

   ```bash
   cd frontend
   npm run dev
   ```

3. **Open Browser**: Navigate to `http://localhost:3001`

## Environment Configuration

### Frontend Environment Files

- `frontend/.env.github` - GitHub Pages configuration
- `frontend/.env.production` - UTA Cloud configuration

### Backend Environment Files

- `backend/.env` - Backend configuration (copy from .env.example)

## Database

The application uses MongoDB. See `docs/TutorTogether.sql` and `docs/TutorTogether_DBDiagram.dbml` for the database schema.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request

## License

This project is licensed under the ISC License.
