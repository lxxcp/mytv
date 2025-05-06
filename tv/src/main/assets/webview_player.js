const ___startTime = Date.now();

// 修改：增强Shadow DOM遍历功能
function getAllVideosInShadowRoots() {
    const videos = [];
    const walker = (root) => {
        const v = root.querySelector('video');
        if (v) videos.push(v);
        root.querySelectorAll('*').forEach(el => {
            if (el.shadowRoot) walker(el.shadowRoot);
        });
    };
    walker(document);
    return videos;
}

function enableVideo(video) {
    video.autoplay = true
    video.volume = 1;
    video.muted = false;
    clearInterval(enableVideo);
}
// 保留原有函数
function getVideoParentShadowRoots() {
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
        const shadowRoot = element.shadowRoot;
        if (shadowRoot) return shadowRoot.querySelector('video');
    }
    return null;
}

// 保留原有函数
function removeVideoPlayerControl() {
    const selectors = [
        '#control_bar_player',
        '#pic_in_pic_player',
        '.con.poster',
        'xg-controls',
        '.xgplayer-controls',
        '[data-kp-role=bottom-controls]',
        '.prism-controlbar',
        '.vjs-control-bar',
        '.playback-layer',
        '.control-bar',
        '.bitrate-layer',
        '.volume-layer',
        '.dplayer-controller',
        '._tdp_contrl'
    ];
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            element.remove();
        });
    });
}

// 修改：增强元素清理功能
function removeAllElementsExceptVideo() {
    const videos = [...document.querySelectorAll('video'), ...getAllVideosInShadowRoots()];
    document.body.innerHTML = '';
    videos.forEach(v => document.body.appendChild(v));
}

// 保留原有函数
function removeAllDivElements() {
    [...document.body.children].forEach((element) => {
        if (element.tagName.toLowerCase() == 'div' || element.tagName.toLowerCase() == 'section') {
            console.info(element.innerHTML);
            element.remove()
        }
    })
}

// 修改：增强视频全屏处理
function addVideoPlayerMask(video) {
    clearInterval(my_pollingIntervalId);
    
    // 创建全屏容器
    const container = document.createElement('div');
    container.style = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:#000;';
    
    // 重置视频样式
    video.style = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        max-width: none !important;
        max-height: none !important;
    `;
    
    // 移除所有可能影响布局的父元素样式
    let parent = video;
    while (parent !== document.body && parent.parentNode) {
        parent = parent.parentNode;
        parent.style = 'all: initial !important;';
    }
    
    container.appendChild(video);
    document.body.innerHTML = '';
    document.body.appendChild(container);
    
    video.muted = false;
    video.volume = 1;
    video.autoplay = true;
    
    // 尝试全屏API
    video.addEventListener('playing', () => {
        if (video.requestFullscreen) {
            video.requestFullscreen().catch(e => console.log(e));
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen().catch(e => console.log(e));
        }
    });
    
    Android.changeVideoResolution(1920, 1080);
}

// 修改：增强主初始化函数
function __initializeMain() {
    // 尝试获取所有可能的video元素
    let videos = [...document.querySelectorAll('video'), ...getAllVideosInShadowRoots()];
    let video = videos.length > 0 ? videos[0] : null;

    if (Date.now() - ___startTime > 15000) {
        clearInterval(my_pollingIntervalId);
        try {
            if (video) video.pause();
        } catch (error) {
            console.error('Error pausing video:', error);
        }
        Android.updatePlaceholderVisible(true,'加载失败');
        return;
    }
    
    if (video && video.src) {
        console.info('找到视频源:', video.src);
        if (video.paused) video.play().catch(e => console.error('播放失败:', e));
        video.volume = 1;
        video.muted = false;
        if (video.videoWidth * video.videoHeight !== 0) {
            removeVideoPlayerControl();
            removeAllElementsExceptVideo();
            addVideoPlayerMask(video);
            setInterval(enableVideo, 100, video); //2秒后再看一下
        }
    }
}

// 保留原有轮询机制
const my_pollingIntervalId = setInterval(__initializeMain, 100);
