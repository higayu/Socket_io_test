// UI関連の機能
class UI {
    constructor() {
        this.opponentArea = document.getElementById('opponentArea');
        this.playerArea = document.getElementById('playerArea');
        this.opponentRole = document.getElementById('opponentRole');
        this.playerRole = document.getElementById('playerRole');
        this.opponentField = document.getElementById('opponentField');
        this.playerField = document.getElementById('playerField');
        this.playerHand = document.getElementById('playerHand');
        this.score = document.getElementById('score');
        this.turnIndicator = document.getElementById('turnIndicator');
        this.status = document.getElementById('status');
    }

    // スコアの更新
    updateScore(score) {
        this.score.textContent = `スコア: ${score}`;
    }

    // ステータスメッセージの表示
    showStatus(message) {
        this.status.textContent = message;
    }

    // ターンインジケーターの表示/非表示
    toggleTurnIndicator(show) {
        this.turnIndicator.classList.toggle('hidden', !show);
    }

    // カードの表示
    displayCard(card, isOpponent = false) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.type} ${isOpponent ? 'hidden' : ''}`;
        
        const nameElement = document.createElement('div');
        nameElement.className = 'card-name';
        nameElement.textContent = card.name;
        
        const descriptionElement = document.createElement('div');
        descriptionElement.className = 'card-description';
        descriptionElement.textContent = card.description;
        
        cardElement.appendChild(nameElement);
        cardElement.appendChild(descriptionElement);
        
        return cardElement;
    }

    // 手札の更新
    updateHand(cards) {
        this.playerHand.innerHTML = '';
        cards.forEach((card, index) => {
            const cardElement = this.displayCard(card);
            cardElement.addEventListener('click', () => {
                // カードクリックイベントはcontrols.jsで処理
                window.dispatchEvent(new CustomEvent('cardPlayed', { detail: { index } }));
            });
            this.playerHand.appendChild(cardElement);
        });
    }

    // フィールドの更新
    updateField(cards, isOpponent = false) {
        const field = isOpponent ? this.opponentField : this.playerField;
        field.innerHTML = '';
        cards.forEach(card => {
            field.appendChild(this.displayCard(card, isOpponent));
        });
    }

    // ロールの表示
    updateRole(isEmperor, isOpponent = false) {
        const roleElement = isOpponent ? this.opponentRole : this.playerRole;
        roleElement.textContent = isEmperor ? '皇帝' : '奴隷';
        roleElement.className = `role ${isEmperor ? 'emperor' : 'slave'}`;
    }
}

// グローバルインスタンスの作成
window.ui = new UI(); 