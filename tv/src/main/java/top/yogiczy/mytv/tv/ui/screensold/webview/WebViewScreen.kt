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
//import top.yogiczy.mytv.core.data.utils.Logger

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    modifier: Modifier = Modifier,
    urlProvider: () -> String = { "https://tv.cctv.com/live/index.shtml" },
    onVideoResolutionChanged: (width: Int, height: Int) -> Unit = { _, _ -> },
) {
    val url = urlProvider()
    var placeholderVisible by remember { mutableStateOf(true) }
    var placeholderMessage by remember { mutableStateOf("加载中...") }
    val logger = remember { Logger.create("WebViewScreen") }

    // 处理webview://前缀
    val actualUrl = remember(url) {
        val processedUrl = if (url.startsWith("webview://")) {
            //logger.i("检测到webview://前缀，正在处理WebView URL")
            url.substring("webview://".length)
        } else {
            url
        }
        //logger.i("WebView加载URL: $processedUrl")
        processedUrl
    }

    val onUpdatePlaceholderVisible = { visible: Boolean, message: String ->
        placeholderVisible = visible
        placeholderMessage = message
    }

    Box(modifier = modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxHeight()
                .background(Color.Black),
            factory = {
                MyWebView(it).apply {
                    webViewClient = MyClient(
                        onPageStarted = { 
                            placeholderVisible = true
                            //logger.i("WebView开始加载页面")
                        },
                        onPageFinished = { 
                            //logger.i("WebView页面加载完成")
                        },
                    )

                    setBackgroundColor(Color.Black.toArgb())
                    layoutParams = ViewGroup.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT,
                        ViewGroup.LayoutParams.MATCH_PARENT,
                    )

                    settings.javaScriptEnabled = true
                    settings.useWideViewPort = true
                    settings.loadWithOverviewMode = true
                    settings.domStorageEnabled = true
                    //settings.databaseEnabled = true
                    settings.loadsImagesAutomatically = false
                    settings.blockNetworkImage = true
                    settings.userAgentString =
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
                    settings.cacheMode = WebSettings.LOAD_DEFAULT
                    settings.javaScriptCanOpenWindowsAutomatically = true
                    settings.setSupportZoom(false)
                    settings.displayZoomControls = false
                    settings.builtInZoomControls = false
                    settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                    settings.mediaPlaybackRequiresUserGesture = false

                    isHorizontalScrollBarEnabled = false
                    isVerticalScrollBarEnabled = false
                    /*isClickable = false
                    isFocusable = false
                    isFocusableInTouchMode = false*/

                    addJavascriptInterface(
                        MyWebViewInterface(
                            onVideoResolutionChanged = onVideoResolutionChanged,
                            onUpdatePlaceholderVisible = onUpdatePlaceholderVisible,
                        ), "Android"
                    )
                }
            },
            update = { it.loadUrl(actualUrl) },
        )

        Visibility({ placeholderVisible }) {
            WebViewPlaceholder(message = placeholderMessage)
        }
    }
}

class MyClient(
    private val onPageStarted: () -> Unit,
    private val onPageFinished: () -> Unit,
) : WebViewClient() {
    private val logger = Logger.create("WebViewClient")
    
    // override fun shouldInterceptRequest(
    //     view: WebView?,
    //     request: WebResourceRequest?
    // ): WebResourceResponse? {
    //     if (request?.url.toString().endsWith(".css"))
    //         return WebResourceResponse("text/css", "UTF-8", null)
    //     return null
    // }

    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
        //logger.i("WebView页面开始加载: $url")
        onPageStarted()
        super.onPageStarted(view, url, favicon)
    }

    fun readAssetFile(context: Context, fileName: String): String {
        val inputStream = context.assets.open(fileName)
        val size = inputStream.available()
        val buffer = ByteArray(size)
        inputStream.read(buffer)
        inputStream.close()
        return String(buffer, Charsets.UTF_8)
    }

    override fun onPageFinished(view: WebView, url: String) {
        //logger.i("WebView页面加载完成: $url")
        val scriptContent = readAssetFile(view.context, "webview_player.js")
        //logger.i("注入脚本到WebView")
        view.evaluateJavascript(scriptContent.trimIndent()
        ) {
            //logger.i("脚本注入完成")
            onPageFinished()
        }
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
) {
    @JavascriptInterface
    fun changeVideoResolution(width: Int, height: Int) {
        onVideoResolutionChanged(width, height)
        onUpdatePlaceholderVisible(false, "")
    }

    @JavascriptInterface
    fun updatePlaceholderVisible(visible: Boolean, message: String) {
        onUpdatePlaceholderVisible(visible, message)
    }
}
