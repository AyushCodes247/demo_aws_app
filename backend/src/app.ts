import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { globalErrorHandler } from "@middlewares/global.middleware.js";
import router from "@routes/index.route.js";
import env from "@configs/env.config.js";
import path from "path";
import { fileURLToPath } from "node:url";

const app: Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);

app.use(helmet());
app.use(
  helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  }),
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

app.use("/api/v1", router);

app.use(express.static(publicDir));

app.get("*name", (req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, "index.html"))
});

app.use(globalErrorHandler);

export default app;
