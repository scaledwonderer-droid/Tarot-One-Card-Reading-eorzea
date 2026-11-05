# Tarot One Card Reading

Tarot制作時のカードアートを使い、通常タロット78枚から1枚を引く完全静的Webアプリです。

HTML・CSS・Vanilla JavaScriptだけで動作します。ビルド、npm、外部サーバー、データベース、APIキーは不要です。

## Features

- 通常タロット78枚から1枚をランダム抽選
- 正位置・逆位置を各50%で判定
- 裏向き表示から静かにめくるカードフリップ
- 英語名・日本語名・向き・キーワード・短いメッセージを表示
- 各カードの正位置・逆位置キーワードを5個ずつ表示
- 同じ結果を整形済みテキストで表示し、ボタンでコピー
- カード画像と全文を左右2カラムのPNG画像で保存
- ページを再読み込みせずに再抽選
- 画像エラー時もカード名とリーディングを表示
- スマートフォン、タブレット、PCに対応
- タッチ、Enter、Space、読み上げ、`prefers-reduced-motion`に対応

## Folder Structure

```text
/
├─ index.html
├─ README.md
├─ css/
│  └─ style.css
├─ js/
│  ├─ cards.js
│  └─ app.js
├─ data/
│  └─ messages.js
└─ assets/
   └─ cards/
      ├─ card-back.webp
      ├─ major/
      ├─ wands/
      ├─ cups/
      ├─ swords/
      └─ coins/
```

## Card List Used in This App

このアプリは通常タロットと同じ78枚構成です。

- Major Arcana：0 THE FOOLから21 THE WORLDまでの22枚
- Minor Arcana：WANDS / CUPS / SWORDS / COINSの4スート
- 各スート：Ace〜Ten、Page、Knight、Queen、Kingの14枚

Cary-Yale独自構成に含まれる次のカードは使用していません。

- Major Arcana：Faith / Hope / Charity
- Court Cards：Maid / Female Knight

スート名は画像と既存データに合わせて、`COINS`表記を維持しています。

## Adding / Replacing Card Images

画像は1200×1800px、縦横比2:3のWebPを使用しています。各カードの画像パスは`js/cards.js`で管理しています。

```text
assets/cards/major/00-fool.webp
assets/cards/wands/ace.webp
assets/cards/cups/ace.webp
assets/cards/swords/ace.webp
assets/cards/coins/ace.webp
assets/cards/card-back.webp
```

画像形式やファイル名を変える場合は、対応する`image`生成部分も変更してください。カード画像はCSSの`object-fit: contain`と`aspect-ratio: 2 / 3`で比率を維持します。

## Editing Card Messages

- カード名、画像パス、正位置・逆位置のキーワード：`js/cards.js`
- 正位置・逆位置の短いメッセージ：`data/messages.js`
- 抽選、表示、コピーなどの動作：`js/app.js`

`data/messages.js`ではカードIDごとに、正位置と逆位置の文章を編集できます。

```js
["major-fool", "正位置のメッセージ", "逆位置のメッセージ"]
```

## GitHub Pages Deployment

1. GitHubで新しいrepositoryを作成します。
2. `index.html`、`README.md`、`css`、`js`、`data`、`assets`をrepository直下へアップロードします。
3. GitHubのSettingsからPagesの設定を開きます。
4. 公開元に`main`ブランチとルートフォルダを指定します。
5. 表示された公開URLへアクセスします。

すべて相対パスで構成しているため、GitHub PagesのサブディレクトリURLでも動作します。

## Saving a Reading Image

リーディングを開いた後、「結果を画像で保存」を選ぶと、カード画像・正逆位置・キーワード・メッセージ全文を含むPNGを作成します。出力は横幅1600pxの左右2カラムで、メッセージの長さに合わせて高さを調整します。画像生成はブラウザ内のCanvasで行い、外部ライブラリやサーバーは使用しません。

## Local Use

`index.html`をブラウザで開くだけで利用できます。クリップボードへの自動コピーがブラウザの制限で使えない場合も、結果テキストを選択してコピーできます。
