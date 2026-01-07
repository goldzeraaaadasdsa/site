import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.join(__dirname, '../logs');

// Define custom log levels with colors
const customLevels = {
  levels: {
    fatal: 0,
    error: 1,
    warn: 2,
    info: 3,
    debug: 4,
    trace: 5,
  },
  colors: {
    fatal: 'red',
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
    trace: 'gray',
  },
};

// Create logger instance
export const logger = winston.createLogger({
  levels: customLevels.levels,
  defaultMeta: { service: 'sim-racing-boost' },
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    // Error log file (only errors and fatals)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
    
    // Combined log file (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  winston.addColors(customLevels.colors);
  
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, timestamp, ...metadata }) => {
          const metaStr = Object.keys(metadata).length
            ? JSON.stringify(metadata)
            : '';
          return `${timestamp} [${level}]: ${message} ${metaStr}`;
        })
      ),
    })
  );
}

// Create request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logObj = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('user-agent'),
      ip: req.ip,
    };

    if (res.statusCode >= 400) {
      logger.warn('Request finished with error', logObj);
    } else {
      logger.info('Request finished', logObj);
    }
  });

  next();
};

export default logger;
