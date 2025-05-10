// コントロール関連の機能
class Controls {
    constructor() {
        this.joinBtn = document.getElementById('joinBtn');
        this.volumeControl = document.getElementById('volumeControl');
        this.bgm = document.getElementById('bgm');
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // 参加ボタンのイベントリスナー
        this.joinBtn.addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('joinGame'));
        });

        // 音量コントロールのイベントリスナー
        this.volumeControl.addEventListener('input', (e) => {
            const volume = parseFloat(e.target.value);
            this.bgm.volume = volume;
        });

        // カードプレイイベントのリスナー
        window.addEventListener('cardPlayed', (e) => {
            const { index } = e.detail;
            window.dispatchEvent(new CustomEvent('playCard', { detail: { index } }));
        });
    }

    // 参加ボタンの有効/無効切り替え
    toggleJoinButton(enabled) {
        this.joinBtn.disabled = !enabled;
        this.joinBtn.style.opacity = enabled ? '1' : '0.5';
    }

    // BGMの再生/停止
    toggleBGM(play) {
        if (play) {
            this.bgm.play();
        } else {
            this.bgm.pause();
        }
    }
}

// グローバルインスタンスの作成
window.controls = new Controls(); 