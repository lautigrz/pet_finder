import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import logger from './infrastructure/logger';
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

