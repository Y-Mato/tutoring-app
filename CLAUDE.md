@AGENTS.md

# 家庭教師アプリ（tutoring-app）

先生と保護者が授業の予定・記録・成績・料金を共有するアプリ。設計は docs/DESIGN.md を参照。

## 前提

- これはポートフォリオ。開発者（Yamato）が理解しながら自分で作ることが目的
- コードを書く前に、何をどう作るかを短く説明し、了承をもらってから実装する
- 一度に大きく作らず、Issueのチェックリストを1つずつ進める

## 作業ルール

- 作業はIssue単位。始める前に対応するIssue番号を確認する
- main に直接コミットしない。`feature/番号-内容` のブランチを切る（例：feature/1-login）
- コミットメッセージは日本語で、末尾に `#Issue番号` を付ける
- PR本文は「やったこと／詰まったこと／解決方法」の3項目で書き、`Closes #番号` を入れる
- 作業が終わったら docs/log/YYYY-MM-DD.md に、やったこと・詰まったこと・学んだことを追記する
- 設計を変えたら docs/DESIGN.md も更新する

## 技術

- Next.js（App Router）、TypeScript、Tailwind CSS
- Firebase（Authentication、Firestore、Cloud Messaging、Cloud Functions）
- FullCalendar、Recharts
- 秘密情報は .env.local に置き、コミットしない
