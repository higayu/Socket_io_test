const socket = io('');

// DOM要素の取得
const joinBtn = document.getElementById('joinBtn');
const status = document.getElementById('status');
const playerHand = document.getElementById('playerHand');
const playerField = document.getElementById('playerField');
const opponentArea = document.getElementById('opponentArea');
const scoreDisplay = document.getElementById('score');
const playerRole = document.getElementById('playerRole');
const opponentRole = document.getElementById('opponentRole');
const turnIndicator = document.getElementById('turnIndicator');
const gameIdDisplay = document.getElementById('gameId');
const roundDisplay = document.getElementById('round');
const gameStatusDisplay = document.getElementById('gameStatus');

// ゲーム状態の更新
function updateGameStatus(status) {
    gameStatusDisplay.textContent = status;
    gameStatusDisplay.className = 'game-status ' + status.toLowerCase();
}

// ラウンドの更新
function updateRound(round) {
    roundDisplay.textContent = `ラウンド: ${round}`;
}

// ゲームIDの更新
function updateGameId(gameId) {
    gameIdDisplay.textContent = `ゲームID: ${gameId}`;
}

// イベントリスナーの設定
joinBtn.addEventListener('click', () => {
    socket.emit('join');
    joinBtn.classList.add('hidden');
    status.textContent = '対戦相手を待っています...';
    updateGameStatus('waiting');
});

socket.on('waiting', () => {
    status.textContent = '対戦相手を待っています...';
});

socket.on('gameStart', (data) => {
    status.textContent = 'ゲーム開始！';
    isMyTurn = data.isFirst;
    isEmperor = data.isEmperor;
    console.log('Game Start - Player is Emperor:', isEmperor);
    
    // ゲーム情報の更新
    updateGameId(data.gameId);
    updateRound(1);
    updateGameStatus('active');
    
    updateHand(data.hand);
    if (data.opponentHand) {
        ui.updateOpponentHand(data.opponentHand);
    }
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
    
    // 相手のフィールドのカードをopponentAreaに直接表示
    const opponentCards = data.opponentField || [];
    opponentArea.innerHTML = '';
    
    // 選択表示を再作成
    const selectingCard = document.createElement('div');
    selectingCard.className = `card selecting ${isEmperor ? 'slave' : 'emperor'}`;
    selectingCard.innerHTML = `
        <div class="card-name">選択中...</div>
        <div class="card-description">相手がカードを選んでいます</div>
    `;
    opponentArea.appendChild(selectingCard);
    
    // フィールドのカードを表示
    opponentCards.forEach(card => {
        const cardElement = createCardElement(card);
        opponentArea.appendChild(cardElement);
    });
    
    // 手札を表示
    if (data.opponentHand) {
        ui.updateOpponentHand(data.opponentHand);
    }
    updateTurnIndicator(false);
});

socket.on('opponentCardPlayed', (data) => {
    const cardElement = createCardElement(data.card);
    cardElement.classList.add('card-played');
    updateField(playerField, data.playerField);
    
    // 相手のフィールドのカードをopponentAreaに直接表示
    const opponentCards = data.opponentField || [];
    opponentArea.innerHTML = '';
    
    // 選択表示を再作成
    const selectingCard = document.createElement('div');
    selectingCard.className = `card selecting ${isEmperor ? 'slave' : 'emperor'}`;
    selectingCard.innerHTML = `
        <div class="card-name">選択中...</div>
        <div class="card-description">相手がカードを選んでいます</div>
    `;
    opponentArea.appendChild(selectingCard);
    
    // フィールドのカードを表示
    opponentCards.forEach(card => {
        const cardElement = createCardElement(card);
        opponentArea.appendChild(cardElement);
    });
    
    // 手札を表示
    if (data.opponentHand) {
        ui.updateOpponentHand(data.opponentHand);
    }
    updateTurnIndicator(true);
});

socket.on('draw', (data) => {
    status.textContent = '引き分け！もう一度カードを出してください';
    updateField(playerField, data.playerField);
    
    // 相手のフィールドのカードをopponentAreaに直接表示
    const opponentCards = data.opponentField || [];
    opponentArea.innerHTML = '';
    
    // 選択表示を再作成
    const selectingCard = document.createElement('div');
    selectingCard.className = `card selecting ${isEmperor ? 'slave' : 'emperor'}`;
    selectingCard.innerHTML = `
        <div class="card-name">選択中...</div>
        <div class="card-description">相手がカードを選んでいます</div>
    `;
    opponentArea.appendChild(selectingCard);
    
    // フィールドのカードを表示
    opponentCards.forEach(card => {
        const cardElement = createCardElement(card);
        opponentArea.appendChild(cardElement);
    });
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
    
    updateGameStatus('finished');
    
    // 3秒後にゲームをリセット
    setTimeout(() => {
        status.textContent = '新しいラウンドを開始します...';
        playerField.innerHTML = '';
        opponentArea.innerHTML = '';
        turnIndicator.classList.add('hidden');
        updateGameStatus('waiting');
    }, 3000);
});

socket.on('revealCards', (data) => {
    updateField(playerField, data.playerField);
    
    // 相手のフィールドのカードをopponentAreaに直接表示
    const opponentCards = data.opponentField || [];
    opponentArea.innerHTML = '';
    
    // 選択表示を再作成
    const selectingCard = document.createElement('div');
    selectingCard.className = `card selecting ${isEmperor ? 'slave' : 'emperor'}`;
    selectingCard.innerHTML = `
        <div class="card-name">選択中...</div>
        <div class="card-description">相手がカードを選んでいます</div>
    `;
    opponentArea.appendChild(selectingCard);
    
    // フィールドのカードを表示
    opponentCards.forEach(card => {
        const cardElement = createCardElement(card);
        opponentArea.appendChild(cardElement);
    });
});

socket.on('opponentSelecting', (data) => {
    console.log('Opponent selecting:', data);
    updateField(opponentArea, data.opponentField);
});

// ラウンド更新イベントの追加
socket.on('roundUpdate', (data) => {
    updateRound(data.round);
}); 