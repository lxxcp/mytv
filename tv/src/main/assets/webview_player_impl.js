const ___startTime = Date.now();
let ___fallbackMode = false; // 回退模式标志
let ___lastVideoCheckTime = 0;

/**
 * 安全获取Shadow DOM中的视频元素
 * 添加了异常处理和超时机制
 */
function getAllVideosSafely() {
    const videos = Array.from(document.querySelectorAll('video'));
    
    // 仅在必要时遍历Shadow DOM
    if (videos.length === 0 || videos[0].videoWidth === 0) {
        try {
            const shadowVideos = [];
            const walker = (root, depth = 0) => {
                if (depth > 5) return; // 防止无限递归
                
                const v = root.querySelector('video');
                if (v) shadowVideos.push(v);
                
                root.querySelectorAll('*').forEach(el => {
                    if (el.shadowRoot) walker(el.shadowRoot, depth + 1);
                });
            };
            
            walker(document);
            videos.push(...shadowVideos);
        } catch (e) {
            console.error('Shadow DOM遍历失败:', e);
        }
    }
    
    return videos;
}

/**
 * 智能清理页面元素
 * 改为隐藏而非删除，保留必要的DOM结构
 */
function optimizePageLayout() {
    const videos = getAllVideosSafely();
    const preserveSelectors = [
        'video', 'iframe', 'canvas', 
        '[class*="player"]', '[id*="player"]',
        '[class*="video"]', '[id*="video"]'
    ];
    
    document.querySelectorAll('*').forEach(el => {
        // 保留视频及其可能相关的容器
        const shouldPreserve = preserveSelectors.some(selector => 
            el.matches(selector) || 
            el.closest(selector) || 
            videos.includes(el)
        );
        
        if (!shouldPreserve) {
            el.style.visibility = 'hidden';
            el.style.opacity = '0';
            el.style.pointerEvents = 'none';
        } else {
            // 重置可能影响视频显示的样式
            el.style.position = '';
            el.style.zIndex = '';
            el.style.transform = '';
        }
    });
    
    // 确保body和html元素有正确样式
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.documentElement.style.overflow = 'hidden';
}

/**
 * 优化视频显示
 * 更温和的样式调整方式
 */
function optimizeVideoDisplay(video) {
    if (!video) return;
    
    // 创建视频容器
    const container = document.createElement('div');
    container.id = 'video-container-enhanced';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 99999;
        background-color: #000;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // 视频样式调整
    video.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;
    
    // 处理可能存在的父容器限制
    let parent = video.parentElement;
    while (parent && parent !== document.body) {
        parent.style.cssText = `
            position: static !important;
            width: 100% !important;
            height: 100% !important;
            overflow: visible !important;
        `;
        parent = parent.parentElement;
    }
    
    // 将视频移动到专用容器
    container.appendChild(video);
    document.body.appendChild(container);
    
    // 确保视频可播放
    video.muted = false;
    video.volume = 1;
    video.autoplay = true;
    video.playsInline = true;
    
    // 尝试播放
    video.play().catch(e => {
        console.warn('自动播放失败:', e);
        video.muted = true;
        video.play().catch(e => console.error('静音播放也失败:', e));
    });
}

/**
 * 回退处理模式
 * 当主模式失败时使用更兼容的方式
 */
function fallbackHandler(video) {
    console.log('进入回退模式，使用更兼容的处理方式');
    
    // 移除之前的容器
    const oldContainer = document.getElementById('video-container-enhanced');
    if (oldContainer) oldContainer.remove();
    
    // 重置视频样式
    video.style.cssText = '';
    
    // 尝试标准全屏API
    function attemptFullscreen() {
        if (video.requestFullscreen) {
            video.requestFullscreen().catch(e => console.log('全屏失败:', e));
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen().catch(e => console.log('webkit全屏失败:', e));
        } else if (video.enterFullscreen) {
            video.enterFullscreen();
        }
    }
    
    // 监听播放事件
    video.addEventListener('playing', attemptFullscreen);
    
    // 立即尝试
    attemptFullscreen();
    
    // 通知Android端
    Android.changeVideoResolution(video.videoWidth || 1920, video.videoHeight || 1080);
    Android.updatePlaceholderVisible(false, '');
}

/**
 * 检查视频状态
 * 确保视频正在正确渲染
 */
function checkVideoState(video) {
    if (!video) return false;
    
    // 检查视频是否可见
    const isVisible = video.offsetWidth > 0 && video.offsetHeight > 0;
    
    // 检查视频是否正在渲染帧
    const isRendering = video.videoWidth > 0 && video.videoHeight > 0;
    
    // 检查是否只有音频
    const isAudioOnly = video.videoWidth === 0 && !video.paused;
    
    // 返回综合状态
    return {
        isValid: isVisible && isRendering,
        isAudioOnly: isAudioOnly,
        isVisible: isVisible,
        isRendering: isRendering
    };
}

/**
 * 主初始化函数
 * 包含完整的错误处理和回退机制
 */
function __initializeMain() {
    // 超时处理
    if (Date.now() - ___startTime > 20000) { // 20秒超时
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载超时');
        return;
    }
    
    // 获取所有视频元素
    const videos = getAllVideosSafely();
    const video = videos[0];
    
    if (!video || !video.src) {
        // 10秒后仍未找到视频才显示错误
        if (Date.now() - ___startTime > 10000) {
            Android.updatePlaceholderVisible(true, '未找到视频源');
        }
        return;
    }
    
    // 检查视频状态
    const videoState = checkVideoState(video);
    const now = Date.now();
    
    // 如果上次检查后状态未改善，则进入回退模式
    if (___fallbackMode || (videoState.isAudioOnly && now - ___lastVideoCheckTime > 3000)) {
        ___fallbackMode = true;
        fallbackHandler(video);
        return;
    }
    
    // 记录最后检查时间
    ___lastVideoCheckTime = now;
    
    // 主处理流程
    if (videoState.isValid) {
        console.log('视频状态良好，进行优化处理');
        optimizePageLayout();
        optimizeVideoDisplay(video);
        
        // 通知Android端
        Android.changeVideoResolution(video.videoWidth, video.videoHeight);
        Android.updatePlaceholderVisible(false, '');
    } else if (!videoState.isRendering && !video.paused) {
        console.warn('视频正在播放但未渲染画面，可能有问题');
    }
    
    // 尝试播放视频
    if (video.paused) {
        video.play().catch(e => {
            console.warn('视频播放失败:', e);
            video.muted = true;
            video.play().catch(e => console.error('静音播放也失败:', e));
        });
    }
}

// 启动轮询，初始频率较高，稳定后降低频率
const my_pollingIntervalId = setInterval(__initializeMain, 300);

// 5秒后降低检查频率
setTimeout(() => {
    clearInterval(my_pollingIntervalId);
    setInterval(__initializeMain, 1000);
}, 5000);