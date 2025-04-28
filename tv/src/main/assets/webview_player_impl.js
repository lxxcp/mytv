const ___startTime = Date.now();
let ___fallbackMode = false;
let ___lastVideoCheckTime = 0;

// ------------------------------
// 增强版视频查找逻辑
// ------------------------------
function findVideoElements() {
    const candidates = [];
    
    // 1. 优先查找普通视频标签
    const explicitVideos = Array.from(document.querySelectorAll('video'));
    if (explicitVideos.length > 0) {
        candidates.push(...explicitVideos);
    }

    // 2. 查找可能包含视频的容器（带特定类名或ID）
    const playerContainers = Array.from(document.querySelectorAll([
        '[class*="player"]', 
        '[id*="player"]',
        '[class*="video"]', 
        '[id*="video"]',
        'iframe'
    ].join(',')));
    
    playerContainers.forEach(container => {
        const shadowVideos = container.shadowRoot?.querySelectorAll('video') || [];
        candidates.push(...shadowVideos);
    });

    // 3. 深度遍历 Shadow DOM（带安全限制）
    const shadowWalker = (root, depth = 0) => {
        if (depth > 3) return; // 限制递归深度
        
        const videos = root.querySelectorAll('video');
        if (videos.length > 0) {
            candidates.push(...videos);
            return; // 找到视频后立即停止
        }
        
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) shadowWalker(el.shadowRoot, depth + 1);
        });
    };
    
    shadowWalker(document);
    
    return candidates;
}

// ------------------------------
// 智能页面清理（保留关键结构）
// ------------------------------
function optimizePageLayout(video) {
    // 标记视频相关元素
    const relatedElements = new Set();
    let parent = video.parentElement;
    
    // 向上追踪保留必要父容器
    while (parent && parent !== document.body) {
        relatedElements.add(parent);
        parent = parent.parentElement;
    }

    // 隐藏无关元素（非删除）
    document.querySelectorAll('*').forEach(el => {
        if (
            !relatedElements.has(el) && 
            !el.contains(video) && 
            !el.matches('video, iframe, canvas, [class*="player"], [id*="player"]')
        ) {
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        } else {
            // 重置关键容器的样式
            el.style.position = '';
            el.style.zIndex = '';
            el.style.width = '';
            el.style.height = '';
        }
    });

    // 确保全局样式
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.documentElement.style.overflow = 'hidden';
}

// ------------------------------
// 视频渲染优化（最小化样式干预）
// ------------------------------
function optimizeVideoDisplay(video) {
    if (!video) return;

    // 创建视频遮罩层
    const container = document.createElement('div');
    container.id = 'video-container-enhanced';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 99999;
        background: #000;
        display: flex !important;
        justify-content: center;
        align-items: center;
    `;

    // 保留原始视频样式（仅覆盖必要属性）
    const originalStyle = video.getAttribute('style') || '';
    video.style.cssText = `
        ${originalStyle};
        max-width: 100% !important;
        max-height: 100% !important;
        object-fit: contain !important;
    `;

    // 插入到body末尾（避免破坏原有结构）
    container.appendChild(video.cloneNode(true));
    document.body.appendChild(container);
    video.remove(); // 移除原始视频（避免重复）

    const optimizedVideo = container.querySelector('video');
    
    // 播放控制
    optimizedVideo.muted = false;
    optimizedVideo.volume = 1;
    optimizedVideo.autoplay = true;
    optimizedVideo.playsInline = true;

    optimizedVideo.play().catch(e => {
        console.warn('自动播放失败，尝试静音播放:', e);
        optimizedVideo.muted = true;
        optimizedVideo.play().catch(e => console.error('静音播放失败:', e));
    });

    return optimizedVideo;
}

// ------------------------------
// 回退处理（使用标准全屏API）
// ------------------------------
function fallbackToStandardMode(video) {
    console.log('进入兼容模式，使用标准全屏API');

    // 恢复原始视频元素
    const originalVideo = document.querySelector('video');
    if (originalVideo) {
        originalVideo.style.cssText = '';
        originalVideo.autoplay = true;
        originalVideo.play().catch(console.error);
    }

    // 触发全屏
    const requestFullscreen = () => {
        if (video.requestFullscreen) {
            video.requestFullscreen().catch(e => console.log('全屏失败:', e));
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen().catch(e => console.log('WebKit全屏失败:', e));
        }
    };

    video.addEventListener('playing', requestFullscreen);
    requestFullscreen();
}

// ------------------------------
// 视频状态监控
// ------------------------------
function checkVideoRendering(video) {
    if (!video) return false;

    // 检测视频是否实际渲染
    const isRendering = video.videoWidth > 0 && video.videoHeight > 0;
    
    // 检测是否为音频（无画面）
    const isAudioOnly = video.videoWidth === 0 && !video.paused;

    // 检测可见性
    const rect = video.getBoundingClientRect();
    const isVisible = rect.width > 0 && rect.height > 0;

    return {
        valid: isRendering && isVisible,
        audioOnly: isAudioOnly
    };
}

// ------------------------------
// 主控制逻辑
// ------------------------------
function __initializeMain() {
    // 超时处理
    if (Date.now() - ___startTime > 15000) {
        Android.updatePlaceholderVisible(true, '加载超时');
        clearInterval(intervalId);
        return;
    }

    // 查找视频元素
    const videos = findVideoElements();
    const video = videos[0];

    if (!video || !video.src) {
        if (Date.now() - ___startTime > 5000) {
            Android.updatePlaceholderVisible(true, '未找到视频源');
        }
        return;
    }

    // 状态检查
    const state = checkVideoRendering(video);
    
    // 处理音频模式
    if (state.audioOnly) {
        console.warn('检测到仅有音频，尝试回退');
        ___fallbackMode = true;
        fallbackToStandardMode(video);
        return;
    }

    // 主优化流程
    if (state.valid && !___fallbackMode) {
        optimizePageLayout(video);
        const optimizedVideo = optimizeVideoDisplay(video);
        Android.changeVideoResolution(optimizedVideo.videoWidth, optimizedVideo.videoHeight);
        Android.updatePlaceholderVisible(false, '');
    } else if (!state.valid) {
        console.warn('视频未正常渲染，启动回退');
        ___fallbackMode = true;
        fallbackToStandardMode(video);
    }
}

// ------------------------------
// 启动轮询（动态频率）
// ------------------------------
let intervalId = setInterval(__initializeMain, 300);
setTimeout(() => {
    clearInterval(intervalId);
    intervalId = setInterval(__initializeMain, 1000);
}, 5000);