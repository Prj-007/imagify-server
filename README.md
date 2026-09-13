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
| POST | `/api/user/pay-razor` | Create a Razorpay order to buy credits |
| POST | `/api/user/verify-razor` | Verify Razorpay payment signature and add credits |
| POST | `/api/image/generate-image` | Generate image from prompt |

## Request Flow

**Image generation:**
```
Client → POST /api/image/generate-image (JWT-authenticated)
       → check user's credit balance
       → GET image.pollinations.ai/prompt/{prompt} (model=flux, enhance=true)
       → deduct 1 credit, return base64 image
```

**Payment (Razorpay):**
```
1. Client → POST /api/user/pay-razor
   → server creates a pending transaction (payment: false)
   → server asks Razorpay to create an order, returns it to the client

2. Client opens Razorpay's checkout with that order, user pays

3. Client → POST /api/user/verify-razor (with Razorpay's response)
   → server recomputes the HMAC-SHA256 signature and compares it
   → server confirms the order status with Razorpay's API
   → only if both checks pass: credits are added, transaction marked paid
```
Credits are never granted on a client-reported "success" alone — the server independently verifies with Razorpay before crediting.

## Project Structure

```
├── server.js                  # Express app entry point, route mounting
├── db.js                      # in-memory Maps (users, transactions) used as a fake DB
├── routes/
│   ├── userRoutes.js          # /api/user/* — auth, credits, payment
│   └── imageRoutes.js         # /api/image/* — generation
├── controllers/
│   ├── UserController.js      # register/login, credits, Razorpay order + verification
│   └── imageController.js     # Pollinations.ai integration
├── models/
│   ├── userModel.js           # thin wrapper over the in-memory users Map
│   └── transactionModel.js    # thin wrapper over the in-memory transactions Map
└── middlewares/
    └── auth.js                # JWT verification, attaches userId to req.body
```

Note: `configs/mongodb.js` exists in the repo but is unused — storage is entirely in-memory (`db.js`), not MongoDB. Data does not persist across server restarts or redeploys.

## Getting Started

```bash
npm install
npm start
```

Set in `.env`: `JWT_SECRET`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `CURRENCY` (optional, defaults to `INR`).
