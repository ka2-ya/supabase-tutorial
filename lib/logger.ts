/**
 * 構造化ロギングユーティリティ
 *
 * 学習ポイント:
 * - 本番環境でのデバッグ支援
 * - 構造化ログによる検索性の向上
 * - エラートラッキング（Sentry等との統合準備）
 * - パフォーマンスモニタリング
 *
 * 本番環境では、適切なロギングは必須です。
 * 問題の早期発見と迅速な解決に役立ちます。
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

/**
 * ロガークラス
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  /**
   * ログを出力
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (this.isDevelopment) {
      // 開発環境では見やすく表示
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      const color = {
        debug: '\x1b[36m', // cyan
        info: '\x1b[34m',  // blue
        warn: '\x1b[33m',  // yellow
        error: '\x1b[31m', // red
      }[level];

      const reset = '\x1b[0m';

      console[level === 'debug' ? 'log' : level](
        `${emoji} ${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`,
        context || ''
      );
    } else {
      // 本番環境では構造化ログ（JSON形式）
      console.log(JSON.stringify(logEntry));
    }

    // 本番環境でエラーが発生した場合、Sentry等に送信
    // if (!this.isDevelopment && level === 'error') {
    //   // Sentry.captureException(context?.error || new Error(message), {
    //   //   extra: context,
    //   // });
    // }
  }

  /**
   * デバッグログ
   * 開発環境でのみ使用
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log('debug', message, context);
    }
  }

  /**
   * 情報ログ
   * 一般的な情報の記録に使用
   */
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  /**
   * 警告ログ
   * 問題の可能性がある場合に使用
   */
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  /**
   * エラーログ
   * エラーが発生した場合に使用
   */
  error(message: string, context?: LogContext) {
    this.log('error', message, context);
  }

  /**
   * パフォーマンス測定
   * 処理時間を測定するためのヘルパー
   */
  async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();

    try {
      const result = await fn();
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.debug(`Performance: ${operation}`, {
        duration: `${duration.toFixed(2)}ms`,
        operation,
      });

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      this.error(`Performance: ${operation} failed`, {
        duration: `${duration.toFixed(2)}ms`,
        operation,
        error,
      });

      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const logger = new Logger();

/**
 * 使用例:
 *
 * ```typescript
 * import { logger } from '@/lib/logger';
 *
 * // 情報ログ
 * logger.info('User logged in', { userId: user.id });
 *
 * // エラーログ
 * logger.error('Failed to fetch todos', {
 *   error: error.message,
 *   userId: user?.id,
 * });
 *
 * // パフォーマンス測定
 * const todos = await logger.measurePerformance(
 *   'fetch todos',
 *   async () => {
 *     return await supabase.from('todos').select('*');
 *   }
 * );
 * ```
 */
