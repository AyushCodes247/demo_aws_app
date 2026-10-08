import dotenv from "dotenv";
dotenv.config();

interface ENV {
  PORT: number;
  DATABASE_URL: string;
  MONGODB_URI: string;
  NODE_ENV: string;
  JWT_ACCESS: string;
  JWT_REFRESH: string;
}

const env: ENV = {
  PORT: Number(process.env.PORT),
  DATABASE_URL: process.env.DATABASE_URL!,
  MONGODB_URI: process.env.MONGODB_URI!,
  NODE_ENV: process.env.NODE_ENV!,
  JWT_ACCESS: process.env.JWT_ACCESS!,
  JWT_REFRESH: process.env.JWT_REFRESH!,
};

export default env;
