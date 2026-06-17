import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import logger from './infrastructure/logger';
import { createServer } from "http";
import { initSocket } from "@infrastructure/websocket/socket";

const PORT = process.env.PORT || 3000;

const httpServer = createServer(app);

initSocket(httpServer)


httpServer.listen(Number(PORT), () => {
    logger.info(`Server is running on port ${PORT}`);
});

