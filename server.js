const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

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
      
      players.set(socket.id, { gameId, choice: null });
      players.set(opponent, { gameId, choice: null });
      
      io.to(socket.id).emit('gameStart', { gameId, opponent: opponent });
      io.to(opponent).emit('gameStart', { gameId, opponent: socket.id });
    } else {
      // 待機リストに追加
      waitingPlayers.push(socket.id);
      socket.emit('waiting');
    }
  });

  // プレイヤーの選択を処理
  socket.on('choice', (choice) => {
    const player = players.get(socket.id);
    if (!player) return;

    player.choice = choice;
    
    // 両プレイヤーの選択が揃ったか確認
    const opponent = Array.from(players.entries())
      .find(([id, p]) => p.gameId === player.gameId && id !== socket.id);
    
    if (opponent && players.get(opponent[0]).choice) {
      const result = determineWinner(player.choice, players.get(opponent[0]).choice);
      io.to(socket.id).emit('result', result);
      io.to(opponent[0]).emit('result', result);
      
      // ゲーム終了後、プレイヤー情報をクリア
      players.delete(socket.id);
      players.delete(opponent[0]);
    }
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

// 勝者判定ロジック
function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return { result: 'draw', choice1, choice2 };
  
  const winConditions = {
    'rock': 'scissors',
    'scissors': 'paper',
    'paper': 'rock'
  };
  
  if (winConditions[choice1] === choice2) {
    return { result: 'win', choice1, choice2 };
  } else {
    return { result: 'lose', choice1, choice2 };
  }
}

const PORT = process.env.PORT || 3000;
const HOST = '192.168.3.56';
http.listen(PORT, HOST, () => {
  console.log(`サーバーが起動しました: http://${HOST}:${PORT}`);
}); 