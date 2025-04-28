const ___startTime = Date.now();

// 增强的视频检测功能，支持Shadow DOM和常见播放器
function findVideoElement() {
    // 1. 查找标准video元素
    let video = document.querySelector('video');
    if (video) return video;
    
    // 2. 查找Shadow DOM中的video
    const getAllShadowRoots = () => {
        const roots = [];
        const walker = (node) => {
            if (node.shadowRoot) {
                roots.push(node.shadowRoot);
                Array.from(node.shadowRoot.children).forEach(walker);
            }
        };
        Array.from(document.querySelectorAll('*')).forEach(walker);
        return roots;
    };
    
    for (const root of getAllShadowRoots()) {
        video = root.querySelector('video');
        if (video) return video;
    }
    
    // 3. 查找常见播放器容器中的video
    const playerContainers = [
        '.prism-player', '.xgplayer', '.dplayer',
        '.video-js', '.jw-player', '.flowplayer'
    ];
    
    for (const selector of playerContainers) {
        const container = document.querySelector(selector);
        if (container) {
            video = container.querySelector('video');
            if (video) return video;
        }
    }
    
    return null;
}

// 更安全的控制栏移除功能
function removePlayerControls() {
    const selectors = [
        // 原有选择器
        '#control_bar_player', '#pic_in_pic_player', '.con.poster',
        'xg-controls', '.xgplayer-controls', '[data-kp-role=bottom-controls]',
        '.prism-controlbar', '.vjs-control-bar', '.playback-layer',
        '.control-bar', '.bitrate-layer', '.volume-layer',
        '.dplayer-controller', '._tdp_contrl',
        
        // 新增选择器
        '.ad-container', '.ad-banner', '.banner-ad',
        '.popup', '.modal', '.login-dialog'
    ];
    
    selectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(el => el.remove());
        } catch (e) {
            console.log('移除元素失败:', selector, e);
        }
    });
}

// 优化全屏显示功能
function setupFullscreenVideo(video) {
    if (!video) return;
    
    // 备份原始状态
    const originalParent = video.parentNode;
    const originalStyle = video.getAttribute('style');
    
    // 创建全屏容器
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
        z-index: 9999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
    `;
    
    // 设置视频样式
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
    const ensurePlayback = () => {
        if (video.paused) {
            video.play().catch(e => {
                console.log('播放失败，尝试静音播放:', e);
                video.muted = true;
                video.play().catch(e => console.log('静音播放失败:', e));
            });
        }
    };
    
    video.addEventListener('loadedmetadata', ensurePlayback);
    video.addEventListener('canplay', ensurePlayback);
    
    // 更新分辨率
    Android.changeVideoResolution(
        video.videoWidth || 1920, 
        video.videoHeight || 1080
    );
    
    // 返回恢复函数
    return () => {
        container.removeChild(video);
        originalParent.appendChild(video);
        if (originalStyle) {
            video.setAttribute('style', originalStyle);
        } else {
            video.removeAttribute('style');
        }
    };
}

// 主初始化函数
function __initializeMain() {
    // 超时处理
    if (Date.now() - ___startTime > 15000) {
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载超时');
        return;
    }
    
    const video = findVideoElement();
    console.log('找到的视频元素:', video);
    
    if (video && video.src) {
        console.log('视频源:', video.src);
        
        // 确保音量设置
        video.muted = false;
        video.volume = 1;
        video.autoplay = true;
        
        // 如果有画面则设置全屏
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            removePlayerControls();
            setupFullscreenVideo(video);
            clearInterval(my_pollingIntervalId);
            Android.updatePlaceholderVisible(false, '');
        } else {
            // 如果还没有画面，等待metadata加载
            video.addEventListener('loadedmetadata', () => {
                if (video.videoWidth > 0 && video.videoHeight > 0) {
                    removePlayerControls();
                    setupFullscreenVideo(video);
                    clearInterval(my_pollingIntervalId);
                    Android.updatePlaceholderVisible(false, '');
                }
            }, { once: true });
        }
    }
}

// 启动轮询
const my_pollingIntervalId = setInterval(__initializeMain, 500);

// 初始执行一次
__initializeMain();