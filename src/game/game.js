const cards = require('./cards');

// プレイヤーの初期状態
function createPlayerState(isEmperor) {
  if (isEmperor) {
    return {
      hand: [
        { id: 1, name: '皇帝', type: 'emperor', description: '市民に勝つ', isSpecial: true },
        ...Array(4).fill({ id: 3, name: '市民', type: 'citizen', description: '奴隷に勝つ' })
      ],
      field: [],
      isEmperor: true,
      isFirst: false,
      score: 0
    };
  } else {
    return {
      hand: [
        { id: 2, name: '奴隷', type: 'slave', description: '皇帝に勝つ', isSpecial: true },
        ...Array(4).fill({ id: 3, name: '市民', type: 'citizen', description: '奴隷に勝つ' })
      ],
      field: [],
      isEmperor: false,
      isFirst: false,
      score: 0
    };
  }
}

// 勝敗判定
function determineWinner(card1, card2) {
  if (card1.type === card2.type) return 'draw';
  
  if (card1.type === 'emperor' && card2.type === 'citizen') return 'player1';
  if (card1.type === 'citizen' && card2.type === 'slave') return 'player1';
  if (card1.type === 'slave' && card2.type === 'emperor') return 'player1';
  
  return 'player2';
}

module.exports = {
  createPlayerState,
  determineWinner
}; 