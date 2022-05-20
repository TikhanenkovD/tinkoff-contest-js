import * as winston from "winston";
import * as path from "path";
import * as util from "util";

const getLogFilename = (): string => {
  const today = new Date();
  const date =
    today.getFullYear() + "-" + today.getMonth() + "-" + today.getDate();
  return date;
};

// To improve: Can be stored as /logs/{date}/full.log
export const logsFolder = path.resolve(__dirname, "../logs");

export const format = winston.format.combine(
  winston.format.timestamp({
    format: "YY-MM-DD HH:mm:ss",
  }),
  winston.format.printf((info) => {
    const args = info[Symbol.for("splat") as any];
    if (args) {
      info.message = util.format(info.message, ...args);
    }
    return `[${info.timestamp}] ${info.level} : ${info.message}`;
  })
);

export const transports = [
  new winston.transports.Console({}),
  new winston.transports.File({
    filename: getLogFilename(),
    dirname: logsFolder,
  }),
];

const baseLogger = winston.createLogger({
  format,
  transports,
});

export default baseLogger;
