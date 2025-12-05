import { z } from 'zod';

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // API Configuration
  VITE_API_URL: z.string().url('Invalid API URL'),
  VITE_API_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()),
  VITE_API_RETRY_ATTEMPTS: z.string().transform(Number).pipe(z.number().min(0).max(10)),
  VITE_API_RETRY_DELAY: z.string().transform(Number).pipe(z.number().positive()),

  // WebSocket Configuration
  VITE_WEBSOCKET_URL: z.string().url('Invalid WebSocket URL'),
  VITE_WS_URL: z.string().url('Invalid WS URL'),

  // External API Keys (optional in development)
  VITE_WEATHERBIT_API_KEY: z.string().optional(),
  VITE_CHATBASE_API_KEY: z.string().optional(),
  VITE_CHATBOT_ID: z.string().optional(),
  VITE_FLOWISE_API_KEY: z.string().optional(),
  VITE_FLOWISE_API_URL: z.string().optional(),

  // Feature Flags
  VITE_ENABLE_MOCK_API: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  VITE_ENABLE_ANALYTICS: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),
  VITE_ENABLE_ERROR_TRACKING: z
    .string()
    .transform((val) => val === 'true')
    .pipe(z.boolean())
    .default('false'),

  // Environment
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_APP_NAME: z.string().default('AgroBridge'),
  VITE_APP_VERSION: z.string().default('1.0.0'),

  // Analytics (optional)
  VITE_GA_TRACKING_ID: z.string().optional(),
  VITE_SENTRY_DSN: z.string().optional(),

  // Payment (optional)
  VITE_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  VITE_FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
});

/**
 * Validate and parse environment variables
 */
function validateEnv() {
  try {
    const parsed = envSchema.parse(import.meta.env);
    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`);
      console.error('❌ Invalid environment variables:', missingVars);
      throw new Error(
        `Environment validation failed:\n${missingVars.join('\n')}\n\nPlease check your .env file.`
      );
    }
    throw error;
  }
}

/**
 * Validated environment variables
 */
export const env = validateEnv();

/**
 * Type-safe environment variables
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Check if running in development mode
 */
export const isDevelopment = env.VITE_APP_ENV === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = env.VITE_APP_ENV === 'production';

/**
 * Check if running in staging mode
 */
export const isStaging = env.VITE_APP_ENV === 'staging';

/**
 * Check if mock API is enabled
 */
export const isMockApiEnabled = env.VITE_ENABLE_MOCK_API;

/**
 * Check if analytics is enabled
 */
export const isAnalyticsEnabled = env.VITE_ENABLE_ANALYTICS;

/**
 * Check if error tracking is enabled
 */
export const isErrorTrackingEnabled = env.VITE_ENABLE_ERROR_TRACKING;
