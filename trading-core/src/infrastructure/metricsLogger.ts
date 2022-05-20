import * as winston from 'winston';
import { format, transports, logsFolder } from '@shared-kernel/logger';


const getLogFilename = () => {
  const today = new Date();
  const date = today.getFullYear() + '-' + today.getMonth() + '-' + today.getDate();
  return `${date}_trade-metrics`;
};

const levels: any = {
    ...winston.config.syslog.levels,
    metrics: 8,
};

const metricsLogger = winston.createLogger({
  format,
  levels,
  transports: transports.concat([
    new winston.transports.File({
      level: 'metrics',
      filename: getLogFilename(),
      dirname: logsFolder,
    }),
  ])
});

(metricsLogger as MetricsLogger).track = (...args: any) => {
  metricsLogger.log('metrics', args);
}

interface MetricsLogger extends winston.Logger {
  track: (...args: any) => void;
};

export default metricsLogger as MetricsLogger;
