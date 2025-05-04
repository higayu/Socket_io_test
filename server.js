const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

// プレイヤーの状態を管理
const players = new Map();
const waitingPlayers = [];

// カードの定義
const cards = [
  { id: 1, name: '皇帝', type: 'emperor', description: '市民に勝つ', isSpecial: true },
  { id: 2, name: '奴隷', type: 'slave', description: '皇帝に勝つ', isSpecial: true },
  { id: 3, name: '市民', type: 'citizen', description: '奴隷に勝つ' }
];

// プレイヤーの初期状態
const createPlayerState = (isEmperor) => ({
  hand: isEmperor ? 
    [{ id: 1, name: '皇帝', type: 'emperor', description: '市民に勝つ', isSpecial: true },
     ...Array(4).fill({ id: 3, name: '市民', type: 'citizen', description: '奴隷に勝つ' })] :
    [{ id: 2, name: '奴隷', type: 'slave', description: '皇帝に勝つ', isSpecial: true },
     ...Array(4).fill({ id: 3, name: '市民', type: 'citizen', description: '奴隷に勝つ' })],
  field: [],
  isEmperor: isEmperor,
  isFirst: false,
  score: 0
});

// 勝敗判定
function determineWinner(card1, card2) {
  if (card1.type === card2.type) return 'draw';
  
  if (card1.type === 'emperor' && card2.type === 'citizen') return 'player1';
  if (card1.type === 'citizen' && card2.type === 'slave') return 'player1';
  if (card1.type === 'slave' && card2.type === 'emperor') return 'player1';
  
  return 'player2';
}

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
        ...player1State
      });
      
      players.set(opponent, { 
        gameId, 
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

    const card = player.hand[cardIndex];
    if (!card) return;

    // カードを手札から場に出す
    player.hand.splice(cardIndex, 1);
    player.field.push(card);

    // 相手に通知
    const opponent = Array.from(players.entries())
      .find(([id, p]) => p.gameId === player.gameId && id !== socket.id);
    
    if (opponent) {
      const opponentPlayer = players.get(opponent[0]);
      
      // 両者がカードを出した場合のみ勝敗判定
      if (player.field.length > 0 && opponentPlayer.field.length > 0) {
        const playerCard = player.field[player.field.length - 1];
        const opponentCard = opponentPlayer.field[opponentPlayer.field.length - 1];
        
        const result = determineWinner(playerCard, opponentCard);
        
        if (result !== 'draw') {
          // 勝敗が決まった場合
          const winner = result === 'player1' ? socket.id : opponent[0];
          const winningPlayer = players.get(winner);
          const isSlaveWin = winningPlayer.isEmperor === false;
          
          // スコア加算（奴隷側の勝利は5倍）
          winningPlayer.score += isSlaveWin ? 5 : 1;
          
          io.to(socket.id).emit('gameOver', { 
            won: winner === socket.id, 
            score: player.score,
            reason: isSlaveWin ? '奴隷の勝利！報酬5倍！' : '皇帝の勝利！'
          });
          
          io.to(opponent[0]).emit('gameOver', { 
            won: winner === opponent[0], 
            score: opponentPlayer.score,
            reason: isSlaveWin ? '奴隷の勝利！報酬5倍！' : '皇帝の勝利！'
          });
        } else {
          // 引き分けの場合
          io.to(socket.id).emit('draw', {
            playerField: player.field,
            opponentField: opponentPlayer.field
          });
          
          io.to(opponent[0]).emit('draw', {
            playerField: opponentPlayer.field,
            opponentField: player.field
          });
        }
      }

      // カードの状態を更新
      io.to(socket.id).emit('cardPlayed', {
        card,
        playerField: player.field,
        opponentField: opponentPlayer.field
      });

      io.to(opponent[0]).emit('opponentCardPlayed', {
        card,
        playerField: opponentPlayer.field,
        opponentField: player.field
      });
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

const PORT = process.env.PORT || 3000;
const HOST = '192.168.3.56';
http.listen(PORT, HOST, () => {
  console.log(`サーバーが起動しました: http://${HOST}:${PORT}`);
}); 