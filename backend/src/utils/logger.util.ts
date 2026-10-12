import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";

const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",

  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),

  defaultMeta: {
    service: "tasklane-api",
  },

  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          )
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const details = Object.keys(meta).length
                ? ` ${JSON.stringify(meta)}`
                : "";

              return `${timestamp} [${level}]: ${message}${details}`;
            }),
          ),
    }),
  ],
});

export default logger;
