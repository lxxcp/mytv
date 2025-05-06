package top.yogiczy.mytv.tv.ui.screensold.webview

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.view.MotionEvent
import android.view.ViewGroup
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.tencent.smtt.sdk.QbSdk
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import top.yogiczy.mytv.core.data.utils.Globals
import top.yogiczy.mytv.core.data.utils.Logger
import top.yogiczy.mytv.tv.ui.material.Visibility
import top.yogiczy.mytv.tv.ui.screensold.webview.components.WebViewPlaceholder
import java.io.File
import java.nio.charset.Charset

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun WebViewScreen(
    modifier: Modifier = Modifier,
    urlProvider: () -> String = { "webview://https://tv.cctv.com/live/index.shtml" },
    onVideoResolutionChanged: (width: Int, height: Int) -> Unit = { _, _ -> },
) {
    val url = urlProvider().removePrefix("webview://")
    var placeholderVisible by remember { mutableStateOf(true) }
    var placeholderMessage by remember { mutableStateOf("加载中...") }
    val context = LocalContext.current
    var isCoreReplaced by remember { mutableStateOf(false) }

    val onUpdatePlaceholderVisible = { visible: Boolean, message: String ->
        placeholderVisible = visible
        placeholderMessage = message
    }

    LaunchedEffect(Unit) {
        isCoreReplaced = WebViewManager.isCoreReplaced()

        if (!isCoreReplaced) {
            WebViewManager.replaceCore(context)
            isCoreReplaced = WebViewManager.isCoreReplaced()
        }
    }

    Visibility({ isCoreReplaced }) {
        Box(modifier = modifier.fillMaxSize()) {
            if (WebViewManager.existTbsX5()) {
                AndroidView(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .fillMaxHeight()
                        .background(Color.Black),
                    factory = {
                        X5WebView(it).apply {
                            webViewClient = X5WebviewClient(
                                onPageStarted = { 
                                    placeholderVisible = true
                                    placeholderMessage = "加载中..."
                                },
                                onPageFinished = { placeholderVisible = false },
                            )

                            setupCommonWebViewSettings()
                            addJavascriptInterface(
                                WebViewInterface(
                                    onVideoResolutionChanged = onVideoResolutionChanged,
                                    onUpdatePlaceholderVisible = onUpdatePlaceholderVisible
                                ), "Android"
                            )
                        }
                    },
                    update = { it.loadUrl(url) },
                )
            } else {
                AndroidView(
                    modifier = Modifier
                        .align(Alignment.Center)
                        .fillMaxHeight()
                        .background(Color.Black),
                    factory = {
                        SystemWebView(it).apply {
                            webViewClient = SystemWebviewClient(
                                onPageStarted = { 
                                    placeholderVisible = true
                                    placeholderMessage = "加载中..."
                                },
                                onPageFinished = { placeholderVisible = false },
                            )

                            setupCommonWebViewSettings()
                            addJavascriptInterface(
                                WebViewInterface(
                                    onVideoResolutionChanged = onVideoResolutionChanged,
                                    onUpdatePlaceholderVisible = onUpdatePlaceholderVisible
                                ), "Android"
                            )
                        }
                    },
                    update = { it.loadUrl(url) },
                )
            }

            Visibility({ placeholderVisible }) {
                WebViewPlaceholder(message = placeholderMessage)
            }
        }
    }
}

private fun Any.setupCommonWebViewSettings() {
    when (this) {
        is android.webkit.WebView -> {
            setBackgroundColor(Color.Black.toArgb())
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )

            settings.apply {
                javaScriptEnabled = true
                useWideViewPort = true
                loadWithOverviewMode = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
                loadsImagesAutomatically = false
                blockNetworkImage = true
                userAgentString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
                javaScriptCanOpenWindowsAutomatically = true
                setSupportZoom(false)
                displayZoomControls = false
                builtInZoomControls = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                mediaPlaybackRequiresUserGesture = false
            }

            isHorizontalScrollBarEnabled = false
            isVerticalScrollBarEnabled = false
            isClickable = false
            isFocusable = false
            isFocusableInTouchMode = false
        }
        is com.tencent.smtt.sdk.WebView -> {
            setBackgroundColor(Color.Black.toArgb())
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT,
            )

            settings.apply {
                javaScriptEnabled = true
                useWideViewPort = true
                loadWithOverviewMode = true
                domStorageEnabled = true
                cacheMode = WebSettings.LOAD_CACHE_ELSE_NETWORK
                loadsImagesAutomatically = false
                blockNetworkImage = true
                userAgentString = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
                javaScriptCanOpenWindowsAutomatically = true
                setSupportZoom(false)
                displayZoomControls = false
                builtInZoomControls = false
                mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                mediaPlaybackRequiresUserGesture = false
            }

            isHorizontalScrollBarEnabled = false
            isVerticalScrollBarEnabled = false
            isClickable = false
            isFocusable = false
            isFocusableInTouchMode = false
        }
    }
}

private class SystemWebviewClient(
    private val onPageStarted: () -> Unit,
    private val onPageFinished: () -> Unit,
) : android.webkit.WebViewClient() {

    override fun onPageStarted(view: android.webkit.WebView?, url: String?, favicon: Bitmap?) {
        onPageStarted()
        super.onPageStarted(view, url, favicon)
    }

    private fun readAssetFile(context: Context, fileName: String): String {
        return context.assets.open(fileName).use { inputStream ->
            val size = inputStream.available()
            val buffer = ByteArray(size)
            inputStream.read(buffer)
            String(buffer, Charset.forName("UTF-8"))
        }
    }

    override fun onPageFinished(view: android.webkit.WebView, url: String) {
        val scriptContent = readAssetFile(view.context, "webview_player.js")
        view.evaluateJavascript(scriptContent.trimIndent()) {
            onPageFinished()
        }
    }
}

private class SystemWebView(context: Context) : android.webkit.WebView(context) {
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent?): Boolean {
        return false
    }
}

private class X5WebviewClient(
    private val onPageStarted: () -> Unit,
    private val onPageFinished: () -> Unit,
) : com.tencent.smtt.sdk.WebViewClient() {

    override fun onPageStarted(
        view: com.tencent.smtt.sdk.WebView?,
        url: String?,
        favicon: Bitmap?
    ) {
        onPageStarted()
        super.onPageStarted(view, url, favicon)
    }

    private fun readAssetFile(context: Context, fileName: String): String {
        return context.assets.open(fileName).use { inputStream ->
            val size = inputStream.available()
            val buffer = ByteArray(size)
            inputStream.read(buffer)
            String(buffer, Charset.forName("UTF-8"))
        }
    }

    override fun onPageFinished(view: com.tencent.smtt.sdk.WebView, url: String) {
        val scriptContent = readAssetFile(view.context, "webview_player.js")
        view.evaluateJavascript(scriptContent.trimIndent()) {
            onPageFinished()
        }
    }
}

private class X5WebView(context: Context) : com.tencent.smtt.sdk.WebView(context) {
    @SuppressLint("ClickableViewAccessibility")
    override fun onTouchEvent(event: MotionEvent?): Boolean {
        return false
    }
}

private class WebViewInterface(
    private val onVideoResolutionChanged: (width: Int, height: Int) -> Unit = { _, _ -> },
    private val onUpdatePlaceholderVisible: (visible: Boolean, message: String) -> Unit = { _, _ -> }
) {
    @JavascriptInterface
    fun changeVideoResolution(width: Int, height: Int) {
        onVideoResolutionChanged(width, height)
        onUpdatePlaceholderVisible(false, "")
    }
}

object WebViewManager {
    private val log = Logger.create("WebViewManager")
    private var coreHasReplaced = false

    fun existTbsX5(): Boolean {
        val tbsX5File = File(Globals.nativeLibraryDir, "libtbs.libmttwebview.so.so")
        return tbsX5File.exists()
    }

    fun isCoreReplaced() = coreHasReplaced

    suspend fun replaceCore(context: Context) = withContext(Dispatchers.IO) {
        log.d("Starting core replacement process")

        if (coreHasReplaced) {
            log.d("Core has already been replaced, skipping replacement")
            return@withContext
        }
        coreHasReplaced = true

        if (!existTbsX5()) {
            log.e("TBS core file not found. Aborting core replacement.")
            return@withContext
        }

        if (QbSdk.canLoadX5(context)) {
            log.d("X5 core is already loaded. No replacement needed.")
            return@withContext
        }

        log.w("X5 core is not loaded. Attempting to preinstall TBS.")
        val ok = QbSdk.preinstallStaticTbs(context)
        log.d("TBS core preinstallation initiated: $ok")
    }
}
