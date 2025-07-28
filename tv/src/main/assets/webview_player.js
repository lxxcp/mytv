const ___startTime = Date.now();

function getVideoParentShadowRoots() {
    // 1. 首先尝试直接查找video元素
    const directVideo = document.querySelector('video');
    if (directVideo) return directVideo;

    // 2. 查找shadow DOM中的video元素
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
        const shadowRoot = element.shadowRoot;
        if (shadowRoot) {
            const shadowVideo = shadowRoot.querySelector('video');
            if (shadowVideo) return shadowVideo;
            
            // 查找shadow DOM中的iframe
            const iframes = shadowRoot.querySelectorAll('iframe');
            for (const iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                    if (iframeDoc) {
                        const iframeVideo = iframeDoc.querySelector('video');
                        if (iframeVideo) return iframeVideo;
                    }
                } catch (e) {
                    console.log('无法访问iframe内容:', e.message);
                }
            }
        }
    }
    
    // 3. 查找常见播放器容器中的video元素
    const playerContainers = [
        '[id*="player"]', '[class*="player"]',
        '[id*="video"]', '[class*="video"]',
        '[id*="Player"]', '[class*="Player"]',
        '[id*="Video"]', '[class*="Video"]',
        'div[data-player]', 'div[data-video]'
    ];
    
    for (const selector of playerContainers) {
        const containers = document.querySelectorAll(selector);
        for (const container of containers) {
            const video = container.querySelector('video');
            if (video) return video;
        }
    }
    
    return null;
}

function removeVideoPlayerControl() {
    const selectors = [
        // 通用控制栏选择器
        '[id*="control"]', '[class*="control"]',
        '[id*="Control"]', '[class*="Control"]',
        '[id*="bar"]', '[class*="bar"]',
        '[id*="Bar"]', '[class*="Bar"]',
        // 常见播放器控制栏
        'video::-webkit-media-controls',
        '.vjs-control-bar',
        '.prism-controlbar',
        '.xgplayer-controls',
        '.dplayer-controller',
        // 播放/暂停按钮
        '[class*="play"]', '[class*="Play"]',
        '[class*="start"]', '[class*="Start"]',
        // 进度条
        '[class*="progress"]', '[class*="Progress"]',
        '[class*="seek"]', '[class*="Seek"]',
        // 音量控制
        '[class*="volume"]', '[class*="Volume"]',
        // 全屏按钮
        '[class*="fullscreen"]', '[class*="Fullscreen"]',
        // 广告和遮罩
        '[class*="ad"]', '[class*="Ad"]',
        '[class*="mask"]', '[class*="Mask"]',
        // 弹窗和浮层
        '.popup', '.modal', '.dialog', '.overlay'
    ];
    
    selectors.forEach(selector => {
        try {
            document.querySelectorAll(selector).forEach(element => {
                element.remove();
            });
        } catch (e) {
            console.log(`移除元素 ${selector} 失败:`, e.message);
        }
    });
    
    // 额外处理内联样式
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.controls = false;
        video.style.pointerEvents = 'none';
    });
}

function removeAllDivElements() {
    [...document.body.children].forEach((element) => {
        const tagName = element.tagName.toLowerCase()
        if (tagName != 'script' && tagName != 'video'){
            element.style.display = 'none';
        } 
    })
}

function addVideoPlayerMask(video) {
    clearInterval(my_pollingIntervalId);
    document.body.appendChild(video);
    removeAllDivElements();
    video.style = 'width: 100%; height: 100%;object-fit: contain;'
    video.autoplay = true
    document.body.style = 'width: 100vw; height: 100vh; margin: 0; min-width: 0; background: #000; padding: 0;'
    Android.changeVideoResolution(1920, 1080);
}

function enableVideo(video) {
    if (video.muted || video.volume != 1 || video.autoplay === false) {
        video.muted = false;
        video.autoplay = true;
        video.volume = 1;
    }else{
        clearInterval(enableVideo);
    }
}

function __initializetMain() {
    let video = document.querySelector('video');
    video = video ? video : getVideoParentShadowRoots();
    if (Date.now() - ___startTime > 15000) {
        clearInterval(my_pollingIntervalId);
        try {
            video?.pause();
        } catch (error) {
            console.error('Error pausing video:', error);
        }
        Android.updatePlaceholderVisible(true,'加载失败');
        return;
    }
    if (video && video.src) {
        console.info(video.src);
        removeVideoPlayerControl();
        if (video.paused) video.play();
        video.volume = 1;
        video.muted = false;
        if (video.videoWidth * video.videoHeight !== 0) addVideoPlayerMask(video);
        setInterval(enableVideo, 100, video);
    }
}

const my_pollingIntervalId = setInterval(__initializetMain, 100);