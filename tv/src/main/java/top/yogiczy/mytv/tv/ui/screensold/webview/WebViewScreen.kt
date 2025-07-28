package top.yogiczy.mytv.tv.ui.screensold.webview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.util.Log
import android.view.MotionEvent
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.CookieManager
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.viewinterop.AndroidView
import top.yogiczy.mytv.core.data.entities.channel.ChannelLine
import top.yogiczy.mytv.tv.ui.material.Visibility
import top.yogiczy.mytv.tv.ui.screensold.webview.components.WebViewPlaceholder
import top.yogiczy.mytv.core.data.utils.Logger
import top.yogiczy.mytv.tv.ui.screen.settings.settingsVM

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    modifier: Modifier = Modifier,
    urlProvider: () -> String = { "https://tv.cctv.com/live/index.shtml" },
    onVideoResolutionChanged: (width: Int, height: Int) -> Unit = { _, _ -> },
) {
    val url = urlProvider()
    var placeholderVisible by remember { mutableStateOf(true) }
    var placeholderMessage by remember { mutableStateOf("正在加载...") }
    val logger = remember { Logger.create("WebViewScreen") }

    // 处理webview://前缀
    val actualUrl = remember(url) {
        val processedUrl = if (url.startsWith("webview://")) {
            logger.i("检测到webview://前缀，正在处理WebView URL")
            url.substring("webview://".length)
        } else {
            url
        }
        logger.i("WebView加载URL: $processedUrl")
        processedUrl
    }
    
    val onUpdatePlaceholderVisible = { visible: Boolean, message: String ->
        placeholderVisible = visible
        placeholderMessage = message
        logger.i("更新占位状态: $visible, 消息: $message")
    }
   
    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxHeight()
                .background(Color.Black.copy(alpha = 0.5f)),
            factory = {
                MyWebView(it).apply {
                    webViewClient = MyClient(
                        onPageStarted = { 
                            placeholderVisible = true
                            placeholderMessage = "正在加载网页，请稍候..."
                            logger.i("WebView开始加载页面")
                        },
                        onPageFinished = { 
                            placeholderMessage = "网页加载完成，正在初始化播放器..."
                            logger.i("WebView页面加载完成")
                        },
                        logger = logger
                    )
                                       
                    setBackgroundColor(Color.Black.toArgb())
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )

                    // 增强的WebView设置
                    settings.apply {
                        javaScriptEnabled = true
                        useWideViewPort = true
                        loadWithOverviewMode = true
                        domStorageEnabled = true
                        loadsImagesAutomatically = false
                        blockNetworkImage = true
                        userAgentString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
                        cacheMode = WebSettings.LOAD_DEFAULT
                        javaScriptCanOpenWindowsAutomatically = true
                        setSupportZoom(false)
                        displayZoomControls = false
                        builtInZoomControls = false
                        mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                        mediaPlaybackRequiresUserGesture = false
                        domStorageEnabled = true
                        allowContentAccess = true
                        allowFileAccess = true
                        setSupportMultipleWindows(true)
                        allowUniversalAccessFromFileURLs = true
                        allowFileAccessFromFileURLs = true
                        databaseEnabled = true
                    }

                    isHorizontalScrollBarEnabled = false
                    isVerticalScrollBarEnabled = false
                    isClickable = false
                    isFocusable = false
                    isLongClickable = false
                    isFocusableInTouchMode = false

                    addJavascriptInterface(
                        MyWebViewInterface(
                            onVideoResolutionChanged = onVideoResolutionChanged,
                            onUpdatePlaceholderVisible = onUpdatePlaceholderVisible,
                            logger = logger
                        ), "Android"
                    )
                }
            },
            update = { webView ->
                webView.loadUrl(actualUrl)
                logger.i("开始加载URL: $actualUrl")
            },
        )

        Visibility({ placeholderVisible }) {
            WebViewPlaceholder(message = placeholderMessage)
        }
    }
}

class MyClient(
    private val onPageStarted: () -> Unit,
    private val onPageFinished: () -> Unit,
    private val logger: Logger
) : WebViewClient() {
    
    // 拦截请求，允许特定域名的资源
    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest?
    ): WebResourceResponse? {
        val url = request?.url.toString()
        logger.d("请求资源: $url")
        
        // 允许特定电视台域名的资源
        val allowedDomains = listOf(
            "jncqrm.cn", "jntlj.com", "jiyangrongmei.cn",
            "cctv.com", "cntv.cn", "mgtv.com",
            "iqiyi.com", "youku.com", "qq.com"
        )
        
        val isAllowed = allowedDomains.any { domain -> url.contains(domain) }
        
        if (!isAllowed && (url.endsWith(".css") || url.endsWith(".js"))) {
            logger.d("阻止加载资源: $url")
            return WebResourceResponse("text/plain", "UTF-8", null)
        }
        
        return super.shouldInterceptRequest(view, request)
    }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        logger.i("页面开始加载: $url")
        onPageStarted()
        super.onPageStarted(view, url, favicon)
    }

    // 从assets读取JS文件
    private fun readAssetFile(context: Context, fileName: String): String {
        return try {
            val inputStream = context.assets.open(fileName)
            val size = inputStream.available()
            val buffer = ByteArray(size)
            inputStream.read(buffer)
            inputStream.close()
            String(buffer, Charsets.UTF_8)
        } catch (e: Exception) {
            logger.e("读取asset文件失败: ${e.message}")
            ""
        }
    }

    override fun onPageFinished(view: WebView, url: String) {
        onPageFinished()
        
        // 注入增强版的JS脚本
        val scriptContent = readAssetFile(view.context, "webview_player.js")
        if (scriptContent.isNotEmpty()) {
            logger.i("注入JavaScript脚本")
            view.evaluateJavascript(scriptContent) {
                logger.i("JavaScript注入完成")
            }
        } else {
            logger.e("无法读取JavaScript脚本内容")
        }
        
        super.onPageFinished(view, url)
    }
    
    // 处理页面加载错误
    override fun onReceivedError(
        view: WebView?,
        errorCode: Int,
        description: String?,
        failingUrl: String?
    ) {
        logger.e("页面加载错误: $errorCode, $description, $failingUrl")
        super.onReceivedError(view, errorCode, description, failingUrl)
    }
}

class MyWebView(context: Context) : WebView(context) {
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent?): Boolean {
        return false
    }
}

class MyWebViewInterface(
    private val onVideoResolutionChanged: (width: Int, height: Int) -> Unit = { _, _ -> },
    private val onUpdatePlaceholderVisible: (visible: Boolean, message: String) -> Unit,
    private val logger: Logger
) {
    @JavascriptInterface
    fun changeVideoResolution(width: Int, height: Int) {
        logger.i("视频分辨率变化: ${width}x${height}")
        onVideoResolutionChanged(width, height)
        onUpdatePlaceholderVisible(false, "")
    }

    @JavascriptInterface
    fun updatePlaceholderVisible(visible: Boolean, message: String) {
        logger.i("更新占位状态: $visible, 消息: $message")
        onUpdatePlaceholderVisible(visible, message)
    }
    
    @JavascriptInterface
    fun log(message: String) {
        logger.d("JS日志: $message")
    }
}