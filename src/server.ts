import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import logger from './infrastructure/logger';

const PORT = process.env.PORT || 3000;

app.listen(Number(PORT), () => {
    logger.info(`Server is running on port ${PORT}`);
});

