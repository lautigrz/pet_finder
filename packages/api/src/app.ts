import express, { Application } from 'express';
import router from './presentation/routes';
import cors from 'cors';
import { errorHandler } from '@presentation/handler/error-handler';
const app: Application = express();



app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


app.use(express.json());
app.use('/api', router);
app.use(errorHandler);
export default app;