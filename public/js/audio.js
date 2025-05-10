const bgm = document.getElementById('bgm');
const volumeControl = document.getElementById('volumeControl');

// 初期音量
bgm.volume = 0.5;

// スライダーで音量調整
volumeControl.addEventListener('input', () => {
    bgm.volume = volumeControl.value;
}); 