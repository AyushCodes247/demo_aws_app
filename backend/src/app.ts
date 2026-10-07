import express, { type Express } from "express";
import cors from "cors";

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  }),
);

export default app;
