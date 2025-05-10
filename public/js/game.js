let score = 0;
let isMyTurn = false;
let isEmperor = false;  // プレイヤーが皇帝かどうかのフラグを追加

function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card ${card.type}${card.hidden ? ' hidden' : ''}`;
    if (!card.hidden) {
        cardElement.innerHTML = `
            <div class="card-name">${card.name}</div>
            <div class="card-description">${card.description}</div>
        `;
    }
    return cardElement;
}

function updateHand(hand) {
    playerHand.innerHTML = '';
    hand.forEach((card, index) => {
        const cardElement = createCardElement(card);
        cardElement.addEventListener('click', () => {
            if (isMyTurn) {
                socket.emit('playCard', index);
            }
        });
        playerHand.appendChild(cardElement);
    });
}

function updateField(fieldElement, cards) {
    fieldElement.innerHTML = '';
    if (cards && cards.length > 0) {
        cards.forEach(card => {
            const cardElement = createCardElement(card);
            fieldElement.appendChild(cardElement);
        });
    }
}

function updateTurnIndicator(isFirst) {
    isMyTurn = isFirst;
    turnIndicator.textContent = isFirst ? 'あなたのターン' : '相手のターン';
    turnIndicator.classList.toggle('hidden', !isFirst);

    // カード選択の表示を更新
    const opponentArea = document.getElementById('opponentArea');
    let selectingCard = opponentArea.querySelector('.card.selecting');
    
    if (isFirst) {
        // あなたのターンの場合、相手の選択中のカードを表示
        if (!selectingCard) {
            selectingCard = document.createElement('div');
            selectingCard.className = 'card selecting hidden';
            selectingCard.innerHTML = `
                <div class="card-name">選択中...</div>
                <div class="card-description">相手がカードを選んでいます</div>
            `;
            opponentArea.insertBefore(selectingCard, opponentArea.firstChild);
        }

        // 相手の役職に応じてクラスを更新
        selectingCard.classList.remove('emperor', 'slave');
        // プレイヤーが皇帝なら相手は奴隷、プレイヤーが奴隷なら相手は皇帝
        const opponentRole = isEmperor ? 'slave' : 'emperor';
        console.log('Player is Emperor:', isEmperor);
        console.log('Setting opponent role to:', opponentRole);
        selectingCard.classList.add(opponentRole);
        selectingCard.classList.remove('hidden');
    } else {
        // 相手のターンの場合、選択中のカードを非表示
        if (selectingCard) {
            selectingCard.classList.add('hidden');
        }
    }
} 