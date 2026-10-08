import app from "@/app.js";
import http from "http";
import env from "@configs/env.config.js";
import connectDB from "@configs/db.config.js";

const server = http.createServer(app);

async function startServer(){
    await connectDB(env.MONGODB_URI);
    server.listen(env.PORT, () => {
        console.info(`TODO's SERVER IS RUNNING ON PORT .: ${env.PORT}`);
    })
}

startServer();