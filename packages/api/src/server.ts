import dotenv from "dotenv";
import "reflect-metadata";
dotenv.config();
import "./container";
import app from "./app";
import { logger } from '@pet-alert/shared';
import { createServer } from "http";
import { initSocket } from "@infrastructure/websocket/socket";
import { initMatchSubscriber } from "@infrastructure/websocket/match-subscriber";

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

initSocket(httpServer)
initMatchSubscriber()


httpServer.listen(Number(PORT), () => {
    logger.info(`Server is running on port ${PORT}`);
});

