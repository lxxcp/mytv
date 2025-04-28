const ___startTime = Date.now();
let ___activeVideo = null;

// 安全获取视频元素（优先可见视频）
function findActiveVideo() {
    // 1. 查找所有视频元素
    const videos = Array.from(document.querySelectorAll('video'));
    
    // 2. 按可见性和尺寸排序
    const validVideos = videos.filter(v => {
        const rect = v.getBoundingClientRect();
        return rect.width > 10 && rect.height > 10;
    }).sort((a, b) => {
        const areaA = a.videoWidth * a.videoHeight;
        const areaB = b.videoWidth * b.videoHeight;
        return areaB - areaA; // 优先选择分辨率高的视频
    });

    return validVideos[0] || null;
}

// 最小化页面处理
function prepareVideoContainer(video) {
    // 创建专用容器（避免修改原有DOM）
    const container = document.createElement('div');
    container.id = 'wvt-video-container';
    container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important; /* 最高优先级 */
        background: #000 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
    `;

    // 克隆视频（保留原始元素）
    const videoClone = video.cloneNode(true);
    videoClone.style.cssText = `
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
    `;

    // 插入到页面底部
    container.appendChild(videoClone);
    document.body.appendChild(container);

    // 设置播放属性
    videoClone.muted = false;
    videoClone.volume = 1;
    videoClone.autoplay = true;
    videoClone.playsInline = true;

    return videoClone;
}

// 智能全屏处理
function handleFullscreen(video) {
    // 尝试标准全屏API
    const attemptStandardFullscreen = () => {
        if (video.requestFullscreen) {
            video.requestFullscreen().catch(e => console.log('标准全屏失败:', e));
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen().catch(e => console.log('WebKit全屏失败:', e));
        }
    };

    // 尝试点击全屏按钮（常见类名匹配）
    const attemptButtonClick = () => {
        const fullscreenButtons = document.querySelectorAll([
            '[class*="fullscreen"]', 
            '[id*="fullscreen"]',
            '[aria-label*="全屏"]',
            '[title*="Fullscreen"]'
        ].join(','));
        
        if (fullscreenButtons.length > 0) {
            fullscreenButtons[0].click();
            console.log('检测到全屏按钮并点击');
        }
    };

    // 双重尝试
    attemptStandardFullscreen();
    setTimeout(attemptButtonClick, 500);
}

// 主检测逻辑
function checkVideo() {
    // 超时处理
    if (Date.now() - ___startTime > 15000) {
        Android.updatePlaceholderVisible(true, '加载超时');
        return;
    }

    // 查找有效视频
    const video = findActiveVideo();
    if (!video || !video.src) return;

    // 避免重复处理
    if (___activeVideo === video) return;
    ___activeVideo = video;

    // 准备视频容器
    const optimizedVideo = prepareVideoContainer(video);
    
    // 播放控制
    optimizedVideo.play().catch(e => {
        console.warn('自动播放失败:', e);
        optimizedVideo.muted = true;
        optimizedVideo.play().catch(e => console.error('静音播放失败:', e));
    });

    // 全屏处理
    handleFullscreen(optimizedVideo);

    // 通知Android端
    Android.changeVideoResolution(
        optimizedVideo.videoWidth || 1920, 
        optimizedVideo.videoHeight || 1080
    );
    Android.updatePlaceholderVisible(false, '');
}

// 启动检测（动态频率）
let checkInterval = setInterval(checkVideo, 300);
setTimeout(() => clearInterval(checkInterval), 15000); // 15秒后停止