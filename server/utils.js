/**
 * Environment validation
 * Ensures all required environment variables are set at startup
 */

export const validateEnvironment = () => {
  const requiredEnvVars = {
    production: ['SESSION_SECRET', 'STEAM_API_KEY', 'FRONTEND_URL'],
    development: ['SESSION_SECRET'],
  };

  const nodeEnv = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[nodeEnv] || requiredEnvVars.development;

  const missing = required.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    console.error(`❌ ${message}`);
    if (nodeEnv === 'production') {
      throw new Error(message);
    }
  }

  return true;
};

/**
 * Safe error formatter for API responses
 * Never exposes stack traces or sensitive information
 */
export const formatApiError = (error, isDevelopment = false) => {
  const errorResponse = {
    ok: false,
    message: 'Internal server error',
  };

  // Log full error for debugging
  console.error('[API Error]', error);

  // In development, include helpful details
  if (isDevelopment && error instanceof Error) {
    errorResponse.message = error.message;
    errorResponse.details = error.stack;
  }

  // In production, never expose details
  return errorResponse;
};

/**
 * Middleware for catching and formatting unhandled errors
 */
export const errorHandler = (err, req, res, next) => {
  console.error('[Error Handler]', {
    message: err.message,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const isDev = process.env.NODE_ENV !== 'production';
  const response = formatApiError(err, isDev);

  res.status(500).json(response);
};

export default { validateEnvironment, formatApiError, errorHandler };
