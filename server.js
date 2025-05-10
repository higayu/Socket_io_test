const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const { createPlayerState } = require('./src/game/game');
const { playCard } = require('./src/game/playManager');

app.use(express.static('public'));

// ゲームグループの管理
class GameGroup {
  constructor() {
    this.players = new Map();  // プレイヤーの状態管理
    this.waitingPlayers = [];  // 待機中のプレイヤー
    this.gameGroups = new Map();  // ゲームグループの管理
  }

  // プレイヤーの追加
  addPlayer(socketId, playerState) {
    this.players.set(socketId, playerState);
  }

  // プレイヤーの削除
  removePlayer(socketId) {
    this.players.delete(socketId);
    const index = this.waitingPlayers.indexOf(socketId);
    if (index > -1) {
      this.waitingPlayers.splice(index, 1);
    }
  }

  // ゲームグループの作成
  createGameGroup(gameId, player1Id, player2Id) {
    const player1 = this.players.get(player1Id);
    const player2 = this.players.get(player2Id);
    
    if (!player1 || !player2) return null;

    const gameGroup = {
      gameId,
      players: [player1Id, player2Id],
      isActive: true,
      currentTurn: player1Id,
      round: 1
    };

    this.gameGroups.set(gameId, gameGroup);
    return gameGroup;
  }

  // ゲームグループの取得
  getGameGroup(gameId) {
    return this.gameGroups.get(gameId);
  }

  // プレイヤーのゲームグループを取得
  getPlayerGameGroup(playerId) {
    for (const [gameId, group] of this.gameGroups) {
      if (group.players.includes(playerId)) {
        return group;
      }
    }
    return null;
  }

  // 対戦相手の取得
  getOpponent(playerId) {
    const gameGroup = this.getPlayerGameGroup(playerId);
    if (!gameGroup) return null;

    const opponentId = gameGroup.players.find(id => id !== playerId);
    return this.players.get(opponentId);
  }
}

// ゲームグループマネージャーのインスタンス化
const gameManager = new GameGroup();

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました:', socket.id);

  // プレイヤーが参加
  socket.on('join', () => {
    if (gameManager.waitingPlayers.length > 0) {
      // 待機中のプレイヤーがいる場合、マッチング
      const opponent = gameManager.waitingPlayers.shift();
      const gameId = Date.now().toString();
      
      // 先手後手をランダムに決定
      const isPlayer1First = Math.random() < 0.5;
      
      const player1State = createPlayerState(isPlayer1First);
      const player2State = createPlayerState(!isPlayer1First);
      
      player1State.isFirst = isPlayer1First;
      player2State.isFirst = !isPlayer1First;
      
      // プレイヤーの状態を追加
      gameManager.addPlayer(socket.id, { 
        gameId, 
        socketId: socket.id,
        ...player1State
      });
      
      gameManager.addPlayer(opponent, { 
        gameId, 
        socketId: opponent,
        ...player2State
      });

      // ゲームグループの作成
      const gameGroup = gameManager.createGameGroup(gameId, socket.id, opponent);
      
      io.to(socket.id).emit('gameStart', { 
        gameId, 
        opponent: opponent,
        hand: player1State.hand,
        isEmperor: player1State.isEmperor,
        isFirst: player1State.isFirst
      });
      
      io.to(opponent).emit('gameStart', { 
        gameId, 
        opponent: socket.id,
        hand: player2State.hand,
        isEmperor: player2State.isEmperor,
        isFirst: player2State.isFirst
      });
    } else {
      gameManager.waitingPlayers.push(socket.id);
      socket.emit('waiting');
    }
  });

  // カードをプレイ
  socket.on('playCard', (cardIndex) => {
    const player = gameManager.players.get(socket.id);
    if (!player) return;
    
    playCard(player, cardIndex, gameManager.players, io);
  });

  // 切断時の処理
  socket.on('disconnect', () => {
    gameManager.removePlayer(socket.id);
  });
});

const PORT = 3001;
const HOST = '192.168.1.147';

http.listen(PORT, HOST, () => {
  console.log(`サーバーが起動しました: http://${HOST}:${PORT}`);
});
