const socket = io('');

// DOM要素の取得
const joinBtn = document.getElementById('joinBtn');
const status = document.getElementById('status');
const playerHand = document.getElementById('playerHand');
const playerField = document.getElementById('playerField');
const opponentField = document.getElementById('opponentField');
const scoreDisplay = document.getElementById('score');
const playerRole = document.getElementById('playerRole');
const opponentRole = document.getElementById('opponentRole');
const turnIndicator = document.getElementById('turnIndicator');

// イベントリスナーの設定
joinBtn.addEventListener('click', () => {
    socket.emit('join');
    joinBtn.classList.add('hidden');
    status.textContent = '対戦相手を待っています...';
});

// Socket.IOイベントハンドラ
socket.on('waiting', () => {
    status.textContent = '対戦相手を待っています...';
});

socket.on('gameStart', (data) => {
    status.textContent = 'ゲーム開始！';
    isMyTurn = data.isFirst;
    updateHand(data.hand);
    playerRole.textContent = data.isEmperor ? 'あなたは皇帝です' : 'あなたは奴隷です';
    playerRole.className = `role ${data.isEmperor ? 'emperor' : 'slave'}`;
    opponentRole.textContent = data.isEmperor ? '相手は奴隷です' : '相手は皇帝です';
    opponentRole.className = `role ${data.isEmperor ? 'slave' : 'emperor'}`;
    updateTurnIndicator(data.isFirst);
});

socket.on('cardPlayed', (data) => {
    const cardElement = createCardElement(data.card);
    cardElement.classList.add('card-played');
    updateField(playerField, data.playerField);
    updateField(opponentField, data.opponentField);
    updateHand(data.hand);
    updateTurnIndicator(false);
});

socket.on('opponentCardPlayed', (data) => {
    const cardElement = createCardElement(data.card);
    cardElement.classList.add('card-played');
    updateField(playerField, data.playerField);
    updateField(opponentField, data.opponentField);
    updateHand(data.hand);
    updateTurnIndicator(true);
});

socket.on('draw', (data) => {
    status.textContent = '引き分け！もう一度カードを出してください';
    updateField(playerField, data.playerField);
    updateField(opponentField, data.opponentField);
    updateHand(data.hand);
});

socket.on('gameOver', (data) => {
    if (data.won) {
        score += data.reason.includes('5倍') ? 5 : 1;
        scoreDisplay.textContent = `スコア: ${score}`;
        status.textContent = data.reason;
    } else {
        status.textContent = '敗北...';
    }
    
    // 3秒後にゲームをリセット
    setTimeout(() => {
        status.textContent = '新しいラウンドを開始します...';
        playerField.innerHTML = '';
        opponentField.innerHTML = '';
        turnIndicator.classList.add('hidden');
    }, 3000);
});

socket.on('revealCards', (data) => {
    updateField(playerField, data.playerField);
    updateField(opponentField, data.opponentField);
});

socket.on('opponentSelecting', (data) => {
    console.log('Opponent selecting:', data);
    updateField(opponentField, data.opponentField);
}); 