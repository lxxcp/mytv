const ___startTime = Date.now();
const MAX_WAIT_TIME = 60000; // 延长至60秒超时

// 增强版的视频元素查找函数
function findVideoElement() {
    // 1. 标准video标签检测
    let video = document.querySelector('video');
    if (video) {
        console.log('找到标准video元素');
        return video;
    }
    
    // 2. 检查iframe中的视频
    const iframes = document.querySelectorAll('iframe');
    for (const iframe of iframes) {
        try {
            if (iframe.contentDocument) {
                video = iframe.contentDocument.querySelector('video');
                if (video) {
                    console.log('在iframe中找到video元素');
                    return video;
                }
                
                // 检查iframe内的shadow DOM
                const iframeElements = iframe.contentDocument.querySelectorAll('*');
                for (const element of iframeElements) {
                    if (element.shadowRoot) {
                        video = element.shadowRoot.querySelector('video');
                        if (video) {
                            console.log('在iframe的shadow DOM中找到video元素');
                            return video;
                        }
                    }
                }
            }
        } catch (e) {
            console.log('无法访问iframe内容:', e.message);
            Android.updatePlaceholderVisible(true, '正在尝试其他方式加载...');
        }
    }
    
    // 3. 深度检查Shadow DOM
    const allElements = document.querySelectorAll('*');
    for (const element of allElements) {
        if (element.shadowRoot) {
            video = element.shadowRoot.querySelector('video');
            if (video) {
                console.log('在shadow DOM中找到video元素');
                return video;
            }
            
            // 检查嵌套的Shadow DOM
            const shadowElements = element.shadowRoot.querySelectorAll('*');
            for (const shadowElement of shadowElements) {
                if (shadowElement.shadowRoot) {
                    video = shadowElement.shadowRoot.querySelector('video');
                    if (video) {
                        console.log('在嵌套shadow DOM中找到video元素');
                        return video;
                    }
                }
            }
        }
    }
    
    // 4. 检查常见播放器容器
    const playerSelectors = [
        '.video-player', '.player-container', 
        '[id*="player"]', '[id*="video"]',
        '.prism-player', '.xgplayer',
        '.dplayer', '.jwplayer',
        '.flowplayer', '.video-js'
    ];
    
    for (const selector of playerSelectors) {
        const players = document.querySelectorAll(selector);
        for (const player of players) {
            video = player.querySelector('video');
            if (video) {
                console.log(`在${selector}容器中找到video元素`);
                return video;
            }
            
            // 检查播放器容器内的shadow DOM
            const playerElements = player.querySelectorAll('*');
            for (const element of playerElements) {
                if (element.shadowRoot) {
                    video = element.shadowRoot.querySelector('video');
                    if (video) {
                        console.log(`在${selector}容器的shadow DOM中找到video元素`);
                        return video;
                    }
                }
            }
        }
    }
    
    console.log('未找到video元素');
    return null;
}

// 增强版的播放控制移除
function removePlayerControls() {
    const controlSelectors = [
        // 原有选择器
        '#control_bar_player', '#pic_in_pic_player',
        '.con.poster', 'xg-controls',
        '.xgplayer-controls', '[data-kp-role=bottom-controls]',
        '.prism-controlbar', '.vjs-control-bar',
        '.playback-layer', '.control-bar',
        '.bitrate-layer', '.volume-layer',
        '.dplayer-controller', '._tdp_contrl',
        
        // 新增常见播放器控制条选择器
        '.controls-container', '.video-controls',
        '.player-controls', '.control-container',
        '[class*="control"]', '[id*="control"]',
        '.progress-bar', '.time-display'
    ];
    
    controlSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(element => {
            try {
                element.style.display = 'none';
                // element.remove();
            } catch (e) {
                console.log(`移除控制元素${selector}失败:`, e.message);
            }
        });
    });
}

// 视频播放准备函数
function prepareVideoPlayback(video) {
    try {
        // 确保视频自动播放
        video.autoplay = true;
        video.muted = false;
        video.volume = 1;
        video.playsInline = true;
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('playsinline', '');
        
        // 尝试播放
        if (video.paused) {
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.log('自动播放被阻止:', e.message);
                    Android.updatePlaceholderVisible(true, '请点击屏幕开始播放');
                });
            }
        }
        
        // 检查视频尺寸
        if (video.videoWidth > 0 && video.videoHeight > 0) {
            console.log(`视频分辨率: ${video.videoWidth}x${video.videoHeight}`);
            Android.changeVideoResolution(video.videoWidth, video.videoHeight);
            return true;
        }
    } catch (e) {
        console.log('视频准备失败:', e.message);
        Android.updatePlaceholderVisible(true, `视频准备错误: ${e.message}`);
    }
    return false;
}

// 主初始化函数
function __initializeMain() {
    const currentTime = Date.now();
    const elapsedTime = currentTime - ___startTime;
    
    if (elapsedTime > MAX_WAIT_TIME) {
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载超时，请检查网络连接');
        return;
    }
    
    const video = findVideoElement();
    
    if (!video) {
        Android.updatePlaceholderVisible(true, `正在查找视频源(${Math.round(elapsedTime/1000)}/${MAX_WAIT_TIME/1000}s)`);
        return;
    }
    
    if (!video.src && !video.querySelector('source')) {
        Android.updatePlaceholderVisible(true, '等待视频源初始化...');
        return;
    }
    
    console.log('找到视频元素:', video);
    Android.updatePlaceholderVisible(true, '正在准备播放...');
    
    // 准备播放
    if (prepareVideoPlayback(video)) {
        // 成功找到并准备播放
        removePlayerControls();
        addVideoPlayerMask(video);
        Android.updatePlaceholderVisible(false, '');
    }
}

// 原有函数保持不变
function addVideoPlayerMask(video) {
    clearInterval(my_pollingIntervalId);
    document.body.appendChild(video);
    removeAllDivElements();
    video.style = 'width: 100%; height: 100%;object-fit: contain;';
    video.autoplay = true;
    document.body.style = 'width: 100vw; height: 100vh; margin: 0; min-width: 0; background: #000; padding: 0;';
}

function removeAllDivElements() {
    [...document.body.children].forEach((element) => {
        const tagName = element.tagName.toLowerCase();
        if (tagName != 'script' && tagName != 'video'){
            element.style.display = 'none';
        } 
    });
}

// 启动检测
const my_pollingIntervalId = setInterval(__initializeMain, 500); // 改为500ms检测一次