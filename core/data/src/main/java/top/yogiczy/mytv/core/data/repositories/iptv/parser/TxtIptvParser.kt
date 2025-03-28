package top.yogiczy.mytv.core.data.repositories.iptv.parser

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import top.yogiczy.mytv.core.data.utils.Logger

/**
 * txt直播源解析
 */
class TxtIptvParser : IptvParser {

    private val logger = Logger.create("TxtIptvParser")

    override fun isSupport(url: String, data: String): Boolean {
        return data.contains("#genre#")
    }

    override suspend fun parse(data: String) =
        withContext(Dispatchers.Default) {
            val lines = data.split("\r\n", "\n")
            val channelList = mutableListOf<IptvParser.ChannelItem>()

            var groupName: String? = null
            lines.forEach { line ->
                if (line.isBlank() || line.startsWith("#") || line.startsWith("//")) return@forEach

                if (line.contains("#genre#")) {
                    groupName = line.split(",", "，").firstOrNull()?.trim()
                } else {
                    val res = line.split(",", "，")
                    if (res.size < 2) return@forEach

                    val rawUrls = res[1]
                    val urls = mutableListOf<String>()
                    val currentWebViewUrl = StringBuilder()

                    // 手动处理#分割，确保webview://链接的完整性
                    rawUrls.split("#").forEach { part ->
                        when {
                            // 检测到webview协议开头，开始拼接
                            part.startsWith("webview://") -> {
                                currentWebViewUrl.clear()
                                currentWebViewUrl.append(part)
                            }
                            // 当前正在拼接webview链接，追加后续部分
                            currentWebViewUrl.isNotEmpty() -> {
                                currentWebViewUrl.append("#").append(part)
                            }
                            // 普通URL直接添加
                            else -> {
                                if (part.isNotBlank()) urls.add(part)
                            }
                        }
                    }

                    // 处理最后一个可能的webview链接
                    if (currentWebViewUrl.isNotEmpty()) {
                        urls.add(currentWebViewUrl.toString())
                    }

                    // 生成ChannelItem列表
                    urls.forEach { rawUrl ->
                        val trimmedUrl = rawUrl.trim()
                        val hybridType = if (trimmedUrl.startsWith("webview://")) {
                            logger.i("检测到WebView链接: $trimmedUrl")
                            IptvParser.ChannelItem.HybridType.WebView
                        } else {
                            IptvParser.ChannelItem.HybridType.None // 假设HybridType有None枚举
                        }

                        channelList.add(
                            IptvParser.ChannelItem(
                                name = res[0].trim(),
                                groupName = groupName ?: "其他",
                                url = trimmedUrl,
                                hybridType = hybridType
                            )
                        )
                    }
                }
            }

            channelList
        }
}
