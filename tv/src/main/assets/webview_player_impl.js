const ___startTime = Date.now();

// 增强的视频检测功能
function findActiveVideoElement() {
    // 1. 优先查找可见的video元素
    const videos = Array.from(document.querySelectorAll('video')).filter(v => {
        const rect = v.getBoundingClientRect();
        return rect.width > 10 && rect.height > 10 && window.getComputedStyle(v).display !== 'none';
    });

    // 优先返回正在播放的视频
    const playingVideo = videos.find(v => !v.paused);
    if (playingVideo) return playingVideo;
    if (videos.length > 0) return videos[0];

    // 2. 检查Shadow DOM
    const walkShadowRoots = (root) => {
        const v = root.querySelector('video');
        if (v) return v;
        for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) {
                const result = walkShadowRoots(el.shadowRoot);
                if (result) return result;
            }
        }
        return null;
    };
    
    const shadowVideo = walkShadowRoots(document);
    if (shadowVideo) return shadowVideo;

    // 3. 检查常见播放器容器
    const playerContainers = [
        '.prism-player', '.xgplayer', '.dplayer',
        '.video-js', '.jw-wrapper', '.flowplayer'
    ];
    
    for (const selector of playerContainers) {
        const container = document.querySelector(selector);
        if (container) {
            const video = container.querySelector('video');
            if (video) return video;
        }
    }

    return null;
}

// 最小化页面清理
function prepareBasicPage() {
    // 仅移除最明显的控制栏
    const controls = [
        '.vjs-control-bar',
        '.xgplayer-controls',
        '.prism-controlbar',
        '.dplayer-controller'
    ].join(',');
    
    document.querySelectorAll(controls).forEach(el => el.remove());
    
    // 设置基本全屏样式
    document.body.style.cssText = `
        margin: 0 !important;
        padding: 0 !important;
        background: #000 !important;
        overflow: hidden !important;
    `;
}

// 安全设置视频全屏
function setupVideoDisplay(video) {
    if (!video) return false;

    // 备份原始状态
    const originalParent = video.parentNode;
    const originalStyle = video.getAttribute('style');
    
    try {
        // 创建简单的全屏容器
        const container = document.createElement('div');
        container.style.cssText = `
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            background: #000 !important;
            z-index: 9999 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
        `;

        // 设置视频基本样式
        video.style.cssText = `
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
        `;

        // 添加到DOM
        container.appendChild(video);
        document.body.innerHTML = '';
        document.body.appendChild(container);

        // 确保播放
        video.muted = false;
        video.volume = 1;
        video.autoplay = true;
        video.playsInline = true;
        
        const playPromise = video.play().catch(e => {
            console.log('播放失败，尝试静音播放:', e);
            video.muted = true;
            return video.play();
        });

        // 更新分辨率
        Android.changeVideoResolution(
            video.videoWidth || 1280, 
            video.videoHeight || 720
        );

        return true;
    } catch (e) {
        console.error('全屏设置失败:', e);
        // 恢复原始状态
        if (originalParent) {
            video.style.cssText = originalStyle || '';
            originalParent.appendChild(video);
        }
        return false;
    }
}

// 主初始化函数
function __initializeMain() {
    // 超时处理
    if (Date.now() - ___startTime > 10000) { // 缩短为10秒超时
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载超时');
        return;
    }

    // 最小化页面准备
    prepareBasicPage();
    
    // 查找视频元素
    const video = findActiveVideoElement();
    console.log('当前视频元素状态:', video);
    
    if (video) {
        console.log('视频信息:', {
            src: video.src,
            readyState: video.readyState,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight,
            paused: video.paused
        });

        // 尝试设置全屏
        if (setupVideoDisplay(video)) {
            clearInterval(my_pollingIntervalId);
            Android.updatePlaceholderVisible(false, '');
            return;
        }
    }
    
    // 如果视频存在但还没准备好，监听准备事件
    if (video && video.readyState < 3) {
        const onReady = () => {
            if (setupVideoDisplay(video)) {
                clearInterval(my_pollingIntervalId);
                Android.updatePlaceholderVisible(false, '');
                video.removeEventListener('canplay', onReady);
            }
        };
        video.addEventListener('canplay', onReady, { once: true });
    }
}

// 启动轮询
const my_pollingIntervalId = setInterval(__initializeMain, 800); // 调整为800ms

// 初始执行
__initializeMain();