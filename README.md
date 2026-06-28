# Imagify — Backend API

Express.js backend for the Imagify AI Image SaaS application.


**Live Demo:** https://client-kappa-sepia-85.vercel.app 

## Tech Stack

- **Runtime:** Node.js, Express.js
- **Auth:** JWT (bcrypt password hashing)
- **Storage:** In-memory (no database required)
- **Image Generation:** Pollinations.ai (free, no API key required)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/user/register` | Register new user (5 free credits) |
| POST | `/api/user/login` | Login and get JWT token |
| GET | `/api/user/credits` | Get user credit balance |
| POST | `/api/user/pay-razor` | Buy credits (demo mode) |
| POST | `/api/image/generate-image` | Generate image from prompt |

## Getting Started

```bash
npm install
npm start
```

Set `JWT_SECRET` in `.env`.
