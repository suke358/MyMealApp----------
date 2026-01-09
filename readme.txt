【プロジェクト環境メモ】
作成日: 2026-01-10

■ サービス情報
・データベース: Supabase
・プロジェクト名: MyMeal_app
・Project ID: jkgpemdagmysnnvucnym
・Project URL: https://jkgpemdagmysnnvucnym.supabase.co

■ 開発ツール
・エディタ: Cursor
・ソース管理: GitHub

■ テーブル構造（mealsテーブル）
・id: int8 (Primary Key)
・meal_name: text (料理名)
・last_eaten_at: timestamptz (最終更新日時 - 自動記録)
・memo: text (メモ・材料)
・main_ingredient: text (メイン食材)

■ 現在の状態
・日付の自動記録機能をできず手動入力
・デザインのレスポンシブ対応