# E-カード ゲーム実装詳細

## 概要
E-カードは、皇帝、奴隷、市民の3種類のカードを使用した対戦型カードゲームです。

## サーバー側のデータ構造

### GameGroupクラス
ゲームの状態を管理するクラスです。

#### プロパティ
- `players`: Map - プレイヤーの状態管理
- `waitingPlayers`: Array - 待機中のプレイヤー
- `gameGroups`: Map - ゲームグループの管理

#### メソッド
- `addPlayer(socketId, playerState)`: プレイヤーを追加
- `removePlayer(socketId)`: プレイヤーを削除
- `createGameGroup(gameId, player1Id, player2Id)`: ゲームグループを作成
- `getGameGroup(gameId)`: ゲームグループを取得
- `getPlayerGameGroup(playerId)`: プレイヤーの所属するゲームグループを取得
- `getOpponent(playerId)`: 対戦相手を取得

### ゲームグループの構造
```javascript
{
  gameId: string,
  players: [player1Id, player2Id],
  isActive: boolean,
  currentTurn: string,
  round: number
}
```

## カード情報の管理

### サーバー側での管理
- `players` Mapオブジェクトで各プレイヤーの状態を管理
- 各プレイヤーの状態には以下が含まれる：
  - `hand`: 手札のカード配列
  - `field`: 場に出したカードの配列
  - `isEmperor`: 皇帝かどうかのフラグ
  - `score`: スコア

### クライアント側での表示
- 自分の手札: `playerHand`要素
- 相手の手札: `opponentHand`要素
- 自分の場: `playerField`要素
- 相手の場: `opponentField`要素

## カード情報の送信

### ゲーム開始時
各プレイヤーに送信される情報：
- 自分の手札（`hand`）
- 自分の役職（`isEmperor`）
- 先手かどうか（`isFirst`）
- 相手の情報は送信されない

### カードプレイ時
1. 先攻プレイヤーに送信される情報：
   - 自分のカード（表向き）
   - 自分の場のカード（表向き）
   - 相手の場のカード（表向き）
   - 自分の手札

2. 後攻プレイヤーに送信される情報：
   - 相手のカード（伏せた状態）
   - 自分の場のカード（表向き）
   - 相手の場のカード（伏せた状態）
   - 自分の手札

## カードの初期化
- 皇帝の場合：
  - 皇帝カード1枚
  - 市民カード4枚
- 奴隷の場合：
  - 奴隷カード1枚
  - 市民カード4枚

## セキュリティ考慮事項
- 相手の手札の内容は常に伏せられた状態で送信
- 相手の手札の枚数のみ表示
- 場に出されたカードのみ内容が公開される

## 技術スタック
- フロントエンド：HTML, CSS, JavaScript
- バックエンド：Node.js
- リアルタイム通信：Socket.IO