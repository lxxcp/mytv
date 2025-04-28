const ___startTime = Date.now();

// 安全获取视频元素，避免过度清理
function findMainVideoElement() {
    // 1. 优先查找主文档中的可见video元素
    const videos = Array.from(document.querySelectorAll('video')).filter(v => {
        const rect = v.getBoundingClientRect();
        return rect.width > 100 && rect.height > 100 && getComputedStyle(v).visibility !== 'hidden';
    });

    if (videos.length > 0) {
        // 优先返回正在播放的视频
        const playingVideo = videos.find(v => !v.paused);
        return playingVideo || videos[0];
    }

    // 2. 检查常见播放器容器
    const playerContainers = [
        '.prism-player', '.xgplayer', '.dplayer',
        '.video-js', '.jw-wrapper', '.flowplayer'
    ].flatMap(selector => 
        Array.from(document.querySelectorAll(selector))
        .filter(el => el.offsetWidth > 100)
    );

    for (const container of playerContainers) {
        const video = container.querySelector('video');
        if (video) return video;
    }

    // 3. 最后尝试iframe内容
    const iframes = Array.from(document.querySelectorAll('iframe'))
        .filter(iframe => {
            try {
                return iframe.contentDocument && 
                       iframe.offsetWidth > 100 && 
                       !iframe.src.startsWith('about:blank');
            } catch (e) {
                return false;
            }
        });

    for (const iframe of iframes) {
        try {
            const iframeDoc = iframe.contentDocument;
            const iframeVideo = iframeDoc.querySelector('video');
            if (iframeVideo && iframeVideo.readyState > 0) {
                return iframeVideo;
            }
        } catch (e) {
            console.log('无法访问iframe内容:', e);
        }
    }

    return null;
}

// 最小化页面清理，只移除最必要的干扰元素
function safelyPreparePage() {
    // 1. 仅移除明显的控制栏
    const controlsToRemove = [
        '.vjs-control-bar', 
        '.xgplayer-controls',
        '.prism-controlbar',
        '.dplayer-controller'
    ].join(',');

    document.querySelectorAll(controlsToRemove).forEach(el => el.remove());

    // 2. 设置最小必要样式
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            overflow: hidden !important;
            background: #000 !important;
            margin: 0 !important;
            height: 100% !important;
        }
    `;
    document.head.appendChild(style);

    // 3. 确保body可见
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
}

// 安全设置视频全屏
function setupVideoPlayer(video) {
    if (!video) return;

    // 1. 备份原始视频状态
    const originalParent = video.parentNode;
    const originalNextSibling = video.nextSibling;
    const originalStyle = video.getAttribute('style');

    // 2. 创建安全的容器
    const container = document.createElement('div');
    container.id = 'video-container';
    container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    `;

    // 3. 设置视频样式（保留原始尺寸比例）
    video.style.cssText = `
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;

    // 4. 添加到DOM
    container.appendChild(video);
    document.body.innerHTML = '';
    document.body.appendChild(container);

    // 5. 确保播放
    const ensurePlayback = () => {
        if (video.paused) {
            video.muted = true; // 先尝试静音播放
            video.play().catch(e => {
                console.log('静音播放失败:', e);
                // 恢复原始状态
                container.removeChild(video);
                originalParent.insertBefore(video, originalNextSibling);
                if (originalStyle) {
                    video.setAttribute('style', originalStyle);
                } else {
                    video.removeAttribute('style');
                }
                video.play().catch(e => console.log('恢复后播放失败:', e));
            });
        }
    };

    video.addEventListener('loadedmetadata', ensurePlayback);
    video.addEventListener('canplay', ensurePlayback);
    
    // 6. 通知Android端
    Android.changeVideoResolution(
        video.videoWidth || 1920, 
        video.videoHeight || 1080
    );
}

// 主初始化函数（更保守的实现）
function __initializeMain() {
    // 超时处理
    if (Date.now() - ___startTime > 15000) {
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载超时');
        return;
    }

    // 1. 最小化页面准备
    safelyPreparePage();

    // 2. 查找视频元素
    const video = findMainVideoElement();
    console.log('找到的视频元素:', video);

    if (video) {
        // 3. 设置视频播放
        setupVideoPlayer(video);
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(false, '');
    } else if (document.readyState === 'complete') {
        // 如果页面已加载完成但没找到视频
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '未找到视频元素');
    }
}

// 更长的轮询间隔减少性能影响
const my_pollingIntervalId = setInterval(__initializeMain, 1000);

// 初始执行一次
__initializeMain();