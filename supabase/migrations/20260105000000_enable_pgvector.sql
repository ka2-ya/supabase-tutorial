/**
 * pgvector拡張の有効化
 *
 * 学習ポイント:
 * - PostgreSQLのベクトル型サポート
 * - 高次元ベクトルの格納と検索
 * - コサイン類似度、L2距離、内積のサポート
 *
 * pgvectorはSupabase Postgresにプリインストールされているため、
 * CREATE EXTENSIONで簡単に有効化できます。
 */

-- pgvector拡張を有効化
CREATE EXTENSION IF NOT EXISTS vector;

-- 拡張が正しく有効化されたか確認
COMMENT ON EXTENSION vector IS 'ベクトル型サポート（OpenAI埋め込みベクトルによる意味検索用）';
