export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    
    // In an enterprise app, this would send to Datadog, New Relic, or Google Cloud Logging
    switch (level) {
      case 'debug':
        console.debug(`[DEBUG] ${timestamp}: ${message}`, data || '');
        break;
      case 'info':
        console.info(`[INFO] ${timestamp}: ${message}`, data || '');
        break;
      case 'warn':
        console.warn(`[WARN] ${timestamp}: ${message}`, data || '');
        break;
      case 'error':
        console.error(`[ERROR] ${timestamp}: ${message}`, data || '');
        break;
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, error?: Error | unknown, data?: Record<string, unknown>) {
    const errorData = error instanceof Error 
      ? { ...data, errorName: error.name, errorMessage: error.message, stack: error.stack }
      : { ...data, rawError: error };
    this.log('error', message, errorData);
  }
}

export const logger = new Logger();
