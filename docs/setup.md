# 環境構築

このリポジトリを clone してから、ローカルで動かせるようになるまでの手順。

## 必要なもの

- Node.js 20.9 以上（開発時は 24.18.0 を使用）
- Firebase のプロジェクト（無料の Spark プランで動く）

## 1. Firebase コンソールでの準備

[Firebase コンソール](https://console.firebase.google.com) で行う。

1. **プロジェクトを作る**
   Google アナリティクスはオフでよい（使っていない）。
2. **Web アプリを登録する**
   プロジェクトの概要 → `</>`（ウェブ）→ アプリ名（例：`tutoring-app-web`）を入れて登録する。Firebase Hosting の設定は不要。
   表示される `firebaseConfig` の値を、手順2で使う。
3. **Authentication を有効にする**
   構築 → Authentication → 始める → Sign-in method →「メール / パスワード」を有効にする（メールリンクはオフのまま）。
4. **Firestore を作る**
   構築 → Firestore Database → データベースを作成。
   - ロケーション：`asia-northeast1`（東京）※あとから変更できない
   - セキュリティルール：**本番環境モード**で開始する（テストモードは30日間だれでも読み書きできてしまう）
5. **セキュリティルールを反映する**
   Firestore Database →「ルール」タブに、リポジトリの `firestore.rules` の中身を貼って「公開」する。
   `firestore.rules` を変更したときは、毎回この作業が必要。
6. **先生アカウントを手で作る**
   アプリから登録できるのは、招待コードを持つ保護者だけ。先生は次のようにコンソールで作る。
   1. Authentication → Users →「ユーザーを追加」で、メールとパスワードを登録する
   2. 一覧に表示された **ユーザー UID** をコピーする
   3. Firestore →「コレクションを開始」→ コレクション ID `users`、ドキュメント ID にコピーした UID を入れ、次のフィールドを追加する

      | フィールド | タイプ | 値 |
      | --- | --- | --- |
      | `role` | string | `teacher` |
      | `name` | string | 先生の名前 |

   ドキュメント ID は必ず UID と同じにする（ログインした人の UID で `users/{uid}` を読むため）。

## 2. 環境変数を設定する

```bash
cp .env.local.example .env.local
```

`.env.local` に、手順1-2の `firebaseConfig` の値を書き写す。値は引用符で囲まず、`=` の前後にスペースを入れない。

| firebaseConfig のキー | .env.local の名前 |
| --- | --- |
| `apiKey` | `NEXT_PUBLIC_FIREBASE_API_KEY` |
| `authDomain` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| `storageBucket` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `NEXT_PUBLIC_FIREBASE_APP_ID` |

- `.env.local` は `.gitignore` で除外されている。コミットしないこと。
- 値が1つでも欠けていると、起動時に「Firebaseの設定が足りません: 〇〇」というエラーが出る（`lib/firebase.ts`）。
- `NEXT_PUBLIC_` 付きの値はブラウザに渡る。Firebase の Web 用設定値はもともと公開される前提のもので、データは Security Rules で守っている。

## 3. 起動する

```bash
npm install
npm run dev
```

http://localhost:3000 を開く。`.env.local` を変更したときは、開発サーバーを再起動する。

## 4. 動作確認

1. 先生アカウントでログイン → 先生用ホームが表示される
2. 「招待コードを発行」で8文字のコードを発行し、ログアウトする
3. ログイン画面の「招待コードをお持ちの方はこちら」から、そのコードで保護者を登録する → 保護者用ホームが表示される
4. 同じコードではもう登録できない（「この招待コードはすでに使われています」）

テスト用の保護者アカウントには、Gmail の `+` エイリアス（例：`yourname+parent1@gmail.com`）を使うと、新しいメールアドレスを用意しなくて済む。
