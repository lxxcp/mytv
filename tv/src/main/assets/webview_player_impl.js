const ___startTime = Date.now();

// 增强的视频检测功能，支持多种播放器类型和IFRAME
function getAllVideoElements() {
    const videos = [];
    
    const collectVideos = (doc) => {
        try {
            // 1. 标准video元素
            const videoElements = doc.querySelectorAll('video');
            videoElements.forEach(v => {
                if (v.readyState > 0 && v.videoWidth > 0 && v.videoHeight > 0) {
                    videos.push(v);
                }
            });

            // 2. 检测H5播放器常用的canvas渲染
            const canvases = Array.from(doc.querySelectorAll('canvas')).filter(c => {
                const rect = c.getBoundingClientRect();
                return rect.width > 100 && rect.height > 100; // 过滤掉小canvas
            });
            videos.push(...canvases);

            // 3. 检测常见播放器容器
            const playerContainers = [
                '.prism-player', '.xgplayer', '.dplayer',
                '.video-js', '.jw-wrapper', '.flowplayer',
                '.player-container', '.video-container'
            ].flatMap(selector => 
                Array.from(doc.querySelectorAll(selector))
            );
            videos.push(...playerContainers);

            // 4. 检测IFRAME内容
            Array.from(doc.querySelectorAll('iframe')).forEach(iframe => {
                try {
                    if (iframe.contentDocument) {
                        collectVideos(iframe.contentDocument);
                    } else if (iframe.src && !iframe.src.startsWith('javascript:')) {
                        // 如果无法直接访问，尝试通过postMessage通信
                        iframe.contentWindow.postMessage('getVideoElements', '*');
                    }
                } catch (e) {
                    console.log('IFRAME访问受限:', e);
                }
            });
        } catch (e) {
            console.error('视频收集错误:', e);
        }
    };

    collectVideos(document);
    return [...new Set(videos)]; // 去重
}

// 增强的页面清理功能
function preparePageForVideoPlayback() {
    // 1. 移除控制栏和广告
    const elementsToRemove = [
        // 控制栏
        '.control-bar', '.vjs-control-bar', '.xgplayer-controls',
        '.prism-controlbar', '.dplayer-controller', '.jw-controlbar',
        // 广告
        '.ad-container', '.ad-box', '.ad-banner', '.ad-wrap',
        // 弹窗
        '.popup', '.modal', '.dialog', '.login-box',
        // 其他干扰元素
        '.header', '.footer', '.sidebar', '.banner'
    ].join(',');

    document.querySelectorAll(elementsToRemove).forEach(el => el.remove());

    // 2. 重置全局样式
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
            background: #000 !important;
        }
        * {
            box-sizing: border-box !important;
        }
    `;
    document.head.appendChild(style);

    // 3. 禁用可能干扰视频的事件
    document.body.style.pointerEvents = 'none';
    document.addEventListener('click', e => e.stopPropagation(), true);
    document.addEventListener('contextmenu', e => e.preventDefault(), true);
}

// 视频全屏处理
function setupVideoFullscreen(video) {
    // 创建全屏容器
    const container = document.createElement('div');
    container.id = 'video-fullscreen-container';
    container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        background: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
    `;

    // 处理canvas元素
    if (video.tagName === 'CANVAS') {
        const videoSource = findVideoSourceForCanvas(video);
        if (videoSource) {
            video = videoSource;
        } else {
            // 对于没有关联video的canvas，尝试直接显示
            video.style.cssText = `
                position: absolute !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                max-width: 100% !important;
                max-height: 100% !important;
                z-index: 2147483647 !important;
            `;
            container.appendChild(video);
            document.body.innerHTML = '';
            document.body.appendChild(container);
            return;
        }
    }

    // 配置video元素
    video.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        z-index: 2147483647 !important;
    `;

    // 确保视频可播放
    video.muted = false;
    video.volume = 1;
    video.autoplay = true;
    video.playsInline = true;
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('playsinline', '');

    container.appendChild(video);
    document.body.innerHTML = '';
    document.body.appendChild(container);

    // 尝试播放
    const tryPlay = () => {
        if (video.paused) {
            video.play().catch(e => {
                console.log('播放失败，尝试静音播放:', e);
                video.muted = true;
                video.play().catch(e => console.log('静音播放也失败:', e));
            });
        }
    };

    // 尝试全屏
    const tryFullscreen = () => {
        if (video.webkitEnterFullscreen) {
            video.webkitEnterFullscreen();
        } else if (video.requestFullscreen) {
            video.requestFullscreen();
        } else if (container.requestFullscreen) {
            container.requestFullscreen();
        }
    };

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    setTimeout(tryFullscreen, 1000);

    Android.changeVideoResolution(1920, 1080);
}

// 查找canvas关联的video源
function findVideoSourceForCanvas(canvas) {
    // 检查同级的video元素
    const parent = canvas.parentElement;
    if (parent) {
        const siblingVideos = parent.querySelectorAll('video');
        if (siblingVideos.length > 0) {
            return siblingVideos[0];
        }
    }
    
    // 检查全局video元素
    const videos = document.querySelectorAll('video');
    for (let i = 0; i < videos.length; i++) {
        if (videos[i].width > 0 && videos[i].height > 0) {
            return videos[i];
        }
    }
    
    return null;
}

// 主初始化函数
function __initializeMain() {
    // 超时处理
    if (Date.now() - ___startTime > 25000) {
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载超时');
        return;
    }

    preparePageForVideoPlayback();
    
    const videos = getAllVideoElements();
    console.log('检测到的视频元素:', videos);

    if (videos.length > 0) {
        // 优先选择正在播放或有画面的视频
        const activeVideos = videos.filter(v => {
            if (v.tagName === 'VIDEO') {
                return !v.paused || v.readyState > 2;
            }
            return true;
        });

        const videoToUse = activeVideos.length > 0 ? activeVideos[0] : videos[0];
        console.log('选择的视频元素:', videoToUse);

        setupVideoFullscreen(videoToUse);
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(false, '');
    }
}

// 监听来自IFRAME的消息
window.addEventListener('message', (event) => {
    if (event.data === 'videoElementsReady') {
        __initializeMain();
    }
});

// 启动轮询
const my_pollingIntervalId = setInterval(__initializeMain, 500);