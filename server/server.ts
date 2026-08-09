import "./configs/instrument.mjs"
import express, { Request, Response } from 'express';
import cors from 'cors'
import 'dotenv/config'
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from './controllers/clerk.js';
import * as Sentry from "@sentry/node"
import userRouter from "./routes/userRoutes.js";
import projectRouter from "./routes/projectRoutes.js";

const app = express();

const port = process.env.PORT || 5000;

//Middleware
app.use(cors());

app.post('/api/clerk',express.raw({ type: 'application/json' }), clerkWebhooks)

app.use(express.json())
app.use(clerkMiddleware())

//routes
app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});
app.get("/debug-sentry", function mainHandler(req, res) {
  throw new Error("My first Sentry error!");
});
app.use('/api/user', userRouter)
app.use('/api/project', projectRouter)
app.use('/api/ai', aiRouter)

import imagekit from "./configs/imagekit.js";
import aiRouter from "./routes/aiRoutes.js";

app.get("/imagekit-test", async (req, res) => {
    res.json({
        public: !!process.env.IMAGEKIT_PUBLIC_KEY,
        private: !!process.env.IMAGEKIT_PRIVATE_KEY,
        endpoint: !!process.env.IMAGEKIT_URL_ENDPOINT,
    });
});

// The error handler must be registered before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});