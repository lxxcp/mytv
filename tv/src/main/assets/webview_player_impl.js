const ___startTime = Date.now();

// 增强的视频检测功能，支持IFRAME和更多播放器类型
function getAllVideoElements() {
    const videos = [];
    
    // 1. 检测主文档中的视频元素
    const collectVideos = (doc) => {
        // 标准video元素
        videos.push(...doc.querySelectorAll('video'));
        
        // Shadow DOM中的video元素
        const walkShadowRoots = (root) => {
            const v = root.querySelector('video');
            if (v) videos.push(v);
            root.querySelectorAll('*').forEach(el => {
                if (el.shadowRoot) walkShadowRoots(el.shadowRoot);
            });
        };
        walkShadowRoots(doc);
        
        // 常见播放器canvas元素
        const canvases = [...doc.querySelectorAll('canvas')].filter(c => {
            const style = getComputedStyle(c);
            return style.display !== 'none' && style.visibility !== 'hidden';
        });
        videos.push(...canvases);
        
        // 常见播放器容器
        const players = [
            '.prism-player', '.xgplayer', '.dplayer', 
            '.video-js', '.jw-player', '.flowplayer'
        ].flatMap(selector => 
            [...doc.querySelectorAll(selector)]
        );
        videos.push(...players);
        
        // 检测IFRAME中的内容
        doc.querySelectorAll('iframe').forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    collectVideos(iframe.contentDocument);
                }
            } catch (e) {
                console.log('无法访问iframe内容:', e);
            }
        });
    };
    
    collectVideos(document);
    return videos.filter((v, i, a) => a.indexOf(v) === i); // 去重
}

// 增强的控件移除功能（支持IFRAME）
function removePlayerControls() {
    const removeInDocument = (doc) => {
        const selectors = [
            // 原有选择器
            '#control_bar_player', '#pic_in_pic_player', '.con.poster',
            'xg-controls', '.xgplayer-controls', '[data-kp-role=bottom-controls]',
            '.prism-controlbar', '.vjs-control-bar', '.playback-layer',
            '.control-bar', '.bitrate-layer', '.volume-layer',
            '.dplayer-controller', '._tdp_contrl',
            
            // 新增常见播放器控制栏选择器
            '.prism-controlbar', '.xgplayer-controls', '.dplayer-controller',
            '.vjs-control-bar', '.jw-controlbar', '.fp-controls',
            '.controls', '.player-controls', '.video-controls',
            
            // 新增广告相关元素
            '.ad-container', '.ad-box', '.ad-banner',
            '.popup', '.modal', '.dialog'
        ];
        
        selectors.forEach(selector => {
            doc.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // 移除全屏限制样式
        doc.querySelectorAll('*').forEach(el => {
            const style = getComputedStyle(el);
            if (style.position === 'fixed' && (style.top === '0' || style.bottom === '0')) {
                el.remove();
            }
        });
        
        // 处理IFRAME中的控件
        doc.querySelectorAll('iframe').forEach(iframe => {
            try {
                if (iframe.contentDocument) {
                    removeInDocument(iframe.contentDocument);
                }
            } catch (e) {
                console.log('无法移除iframe控件:', e);
            }
        });
    };
    
    removeInDocument(document);
}

// 增强的视频全屏处理（支持从IFRAME提取视频）
function prepareVideoForFullscreen(video) {
    // 如果视频在IFRAME中，尝试将其移到主文档
    if (video.ownerDocument !== document) {
        try {
            const clonedVideo = video.cloneNode(true);
            document.body.appendChild(clonedVideo);
            video = clonedVideo;
        } catch (e) {
            console.log('无法克隆iframe视频:', e);
        }
    }
    
    // 确保元素可见
    video.style.opacity = '1';
    video.style.visibility = 'visible';
    video.style.display = 'block';
    video.style.zIndex = '99999';
    
    // 移除可能影响显示的父元素样式
    let parent = video;
    while (parent !== document.body && parent.parentNode) {
        parent = parent.parentNode;
        parent.style.overflow = 'visible';
        parent.style.position = 'static';
    }
    
    // 创建全屏容器
    const container = document.createElement('div');
    container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 999999 !important;
        background: #000 !important;
        margin: 0 !important;
        padding: 0 !important;
    `;
    
    // 重置视频样式
    video.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
        max-width: none !important;
        max-height: none !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        z-index: 999999 !important;
    `;
    
    container.appendChild(video);
    document.body.innerHTML = '';
    document.body.appendChild(container);
    
    // 确保视频播放
    video.muted = false;
    video.volume = 1;
    video.autoplay = true;
    video.playsInline = true;
    
    // 尝试全屏
    const tryFullscreen = () => {
        if (video.requestFullscreen) {
            video.requestFullscreen().catch(e => console.log('Fullscreen error:', e));
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen().catch(e => console.log('Fullscreen error:', e));
        } else if (container.requestFullscreen) {
            container.requestFullscreen().catch(e => console.log('Fullscreen error:', e));
        }
    };
    
    video.addEventListener('playing', tryFullscreen, { once: true });
    setTimeout(tryFullscreen, 1000);
    
    Android.changeVideoResolution(1920, 1080);
}

// 主初始化函数
function __initializeMain() {
    const videos = getAllVideoElements();
    console.log('找到的视频元素数量:', videos.length);
    
    // 超时处理
    if (Date.now() - ___startTime > 20000) {
        clearInterval(my_pollingIntervalId);
        Android.updatePlaceholderVisible(true, '加载失败');
        return;
    }
    
    // 优先处理正在播放的视频
    const playingVideos = videos.filter(v => !v.paused);
    const videoToUse = playingVideos.length > 0 ? playingVideos[0] : videos[0];
    
    if (videoToUse) {
        console.log('准备处理的视频元素:', videoToUse);
        
        // 针对canvas的特殊处理
        if (videoToUse.tagName.toLowerCase() === 'canvas') {
            const source = videoToUse.parentElement.querySelector('video');
            if (source) {
                console.log('找到canvas关联的video源:', source);
                prepareVideoForFullscreen(source);
                return;
            }
        }
        
        // 标准video元素处理
        if (videoToUse.tagName.toLowerCase() === 'video' && videoToUse.readyState > 0) {
            removePlayerControls();
            prepareVideoForFullscreen(videoToUse);
            
            // 确保视频播放
            if (videoToUse.paused) {
                videoToUse.play().catch(e => {
                    console.error('播放失败:', e);
                    videoToUse.muted = true;
                    videoToUse.play().catch(e => console.error('静音播放失败:', e));
                });
            }
        }
    }
}

// 启动轮询
const my_pollingIntervalId = setInterval(__initializeMain, 300);