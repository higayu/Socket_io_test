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
    
    // 先攻プレイヤーには自分のカードを表向きで通知
    io.to(player.socketId).emit('cardPlayed', {
      card,
      playerField: player.field,
      opponentField: opponentPlayer.field.map(c => ({ ...c, hidden: false })),
      hand: player.hand
    });

    // 後攻プレイヤーには先攻プレイヤーのカードを伏せた状態で通知
    io.to(opponent[0]).emit('opponentCardPlayed', {
      card: { ...card, hidden: true },
      playerField: opponentPlayer.field.map(c => ({ ...c, hidden: false })),
      opponentField: player.field.map(c => ({ ...c, hidden: true })),
      hand: opponentPlayer.hand
    });

    // 相手がカードを選んでいる状態を通知
    io.to(opponent[0]).emit('opponentSelecting', {
      opponentField: [{ type: 'selecting', hidden: true }]
    });

    // 両者がカードを出した場合のみ勝敗判定
    if (player.field.length > 0 && opponentPlayer.field.length > 0) {
      // 後攻プレイヤーのカードを伏せた状態で通知
      io.to(player.socketId).emit('opponentCardPlayed', {
        card: { ...opponentPlayer.field[opponentPlayer.field.length - 1], hidden: true },
        playerField: player.field.map(c => ({ ...c, hidden: false })),
        opponentField: opponentPlayer.field.map(c => ({ ...c, hidden: true })),
        hand: player.hand
      });

      // 少し遅延を入れてからカードを表向きにする
      setTimeout(() => {
        handleRoundResult(player, opponentPlayer, players, io);
      }, 1000); // 1秒後にカードを表向きにする
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