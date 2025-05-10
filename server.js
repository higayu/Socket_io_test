const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const { createPlayerState } = require('./src/game/game');
const { playCard } = require('./src/game/playManager');

app.use(express.static('public'));

// プレイヤーの状態を管理
const players = new Map();
const waitingPlayers = [];

io.on('connection', (socket) => {
  console.log('ユーザーが接続しました:', socket.id);

  // プレイヤーが参加
  socket.on('join', () => {
    if (waitingPlayers.length > 0) {
      // 待機中のプレイヤーがいる場合、マッチング
      const opponent = waitingPlayers.shift();
      const gameId = Date.now().toString();
      
      // 先手後手をランダムに決定
      const isPlayer1First = Math.random() < 0.5;
      
      const player1State = createPlayerState(isPlayer1First);
      const player2State = createPlayerState(!isPlayer1First);
      
      player1State.isFirst = isPlayer1First;
      player2State.isFirst = !isPlayer1First;
      
      players.set(socket.id, { 
        gameId, 
        socketId: socket.id,
        ...player1State
      });
      
      players.set(opponent, { 
        gameId, 
        socketId: opponent,
        ...player2State
      });
      
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
      waitingPlayers.push(socket.id);
      socket.emit('waiting');
    }
  });

  // カードをプレイ
  socket.on('playCard', (cardIndex) => {
    const player = players.get(socket.id);
    if (!player) return;
    
    playCard(player, cardIndex, players, io);
  });

  // 切断時の処理
  socket.on('disconnect', () => {
    const index = waitingPlayers.indexOf(socket.id);
    if (index > -1) {
      waitingPlayers.splice(index, 1);
    }
    players.delete(socket.id);
  });
});

const PORT = 3001;
const HOST = '192.168.1.147';

http.listen(PORT, HOST, () => {
  console.log(`サーバーが起動しました: http://${HOST}:${PORT}`);
});
