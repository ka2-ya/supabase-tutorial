# セキュリティポリシー

## サポートされているバージョン

現在、このプロジェクトの最新バージョンのみがサポートされています。

## 脆弱性の報告

もしセキュリティ上の問題を発見した場合は、以下の方法で報告してください:

1. **公開Issueを作成しない**: セキュリティの脆弱性は公開せず、非公開で報告してください
2. **GitHubのSecurity Advisoryを使用**: このリポジトリの「Security」タブから報告できます
3. **詳細を含める**: 問題の再現手順、影響範囲、可能な場合は修正案を含めてください

## 学習用プロジェクトに関する注意

このプロジェクトは**学習目的**で作成されています:

- Row Level Security (RLS)ポリシーは簡略化されています
- 本番環境での使用を想定していません
- 実際のアプリケーションでは、より厳密なセキュリティ設定が必要です

## ベストプラクティス

このプロジェクトを学習する際は:

- ✅ `.env.local`ファイルをGitにコミットしない
- ✅ `service_role`キーを絶対に公開しない
- ✅ 実際のプロジェクトではより厳格なRLSポリシーを実装する
- ✅ 本番環境では環境変数を安全に管理する

## 参考リソース

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
