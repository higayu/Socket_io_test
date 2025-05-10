const { determineWinner } = require('./game');

// カードをプレイする処理
function playCard(player, cardIndex, players, io) {
  const card = player.hand[cardIndex];
  if (!card) return;

  // カードを手札から場に出す
  player.hand.splice(cardIndex, 1);
  player.field.push(card);

  // 相手に通知
  const opponent = Array.from(players.entries())
    .find(([id, p]) => p.gameId === player.gameId && id !== player.socketId);
  
  if (opponent) {
    const opponentPlayer = players.get(opponent[0]);
    
    // カードの状態を更新
    io.to(player.socketId).emit('cardPlayed', {
      card,
      playerField: player.field,
      opponentField: opponentPlayer.field.map(c => ({ ...c, hidden: false })),
      hand: player.hand
    });

    io.to(opponent[0]).emit('opponentCardPlayed', {
      card: { ...card, hidden: true }, // 相手のカードは裏向き
      playerField: opponentPlayer.field.map(c => ({ ...c, hidden: false })),
      opponentField: player.field.map(c => ({ ...c, hidden: true })), // 相手のフィールドは裏向き
      hand: opponentPlayer.hand
    });

    // 両者がカードを出した場合のみ勝敗判定
    if (player.field.length > 0 && opponentPlayer.field.length > 0) {
      handleRoundResult(player, opponentPlayer, players, io);
    }
  }
}

// ラウンド結果の処理
function handleRoundResult(player, opponentPlayer, players, io) {
  const playerCard = player.field[player.field.length - 1];
  const opponentCard = opponentPlayer.field[opponentPlayer.field.length - 1];
  
  const result = determineWinner(playerCard, opponentCard);
  
  if (result !== 'draw') {
    handleWinner(player, opponentPlayer, result, players, io);
  } else {
    handleDraw(player, opponentPlayer, io);
  }
}

// 勝者の処理
function handleWinner(player, opponentPlayer, result, players, io) {
  const winner = result === 'player1' ? player.socketId : opponentPlayer.socketId;
  const winningPlayer = players.get(winner);
  const isSlaveWin = winningPlayer.isEmperor === false;
  
  // スコア加算（奴隷側の勝利は5倍）
  winningPlayer.score += isSlaveWin ? 5 : 1;
  
  // 勝敗が決まったら両者のカードを公開
  io.to(player.socketId).emit('revealCards', {
    playerField: player.field.map(c => ({ ...c, hidden: false })),
    opponentField: opponentPlayer.field.map(c => ({ ...c, hidden: false }))
  });
  
  io.to(opponentPlayer.socketId).emit('revealCards', {
    playerField: opponentPlayer.field.map(c => ({ ...c, hidden: false })),
    opponentField: player.field.map(c => ({ ...c, hidden: false }))
  });
  
  io.to(player.socketId).emit('gameOver', { 
    won: winner === player.socketId, 
    score: player.score,
    reason: isSlaveWin ? '奴隷の勝利！報酬5倍！' : '皇帝の勝利！'
  });
  
  io.to(opponentPlayer.socketId).emit('gameOver', { 
    won: winner === opponentPlayer.socketId, 
    score: opponentPlayer.score,
    reason: isSlaveWin ? '奴隷の勝利！報酬5倍！' : '皇帝の勝利！'
  });
}

// 引き分けの処理
function handleDraw(player, opponentPlayer, io) {
  io.to(player.socketId).emit('draw', {
    playerField: player.field.map(c => ({ ...c, hidden: false })),
    opponentField: opponentPlayer.field.map(c => ({ ...c, hidden: true })),
    hand: player.hand
  });
  
  io.to(opponentPlayer.socketId).emit('draw', {
    playerField: opponentPlayer.field.map(c => ({ ...c, hidden: false })),
    opponentField: player.field.map(c => ({ ...c, hidden: true })),
    hand: opponentPlayer.hand
  });
}

module.exports = {
  playCard
}; 