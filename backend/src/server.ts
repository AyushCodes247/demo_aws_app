import app from "@/app.js";
import http from "http";
import env from "@configs/env.config.js";
import connectDB from "@configs/db.config.js";
import redis from "@configs/redis.config.js";
import logger from "@utils/logger.util.js";

const server = http.createServer(app);

async function startServer() {
  await redis.connect();
  await connectDB(env.MONGODB_URI);
  server.listen(env.PORT, () => {
    logger.info(`TODO's SERVER IS RUNNING ON PORT .: ${env.PORT}`);
  });
}

startServer();
