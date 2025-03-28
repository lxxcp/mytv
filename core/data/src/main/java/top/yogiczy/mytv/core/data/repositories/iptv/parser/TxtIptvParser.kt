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

                    // 关键修复：使用迭代逻辑精确处理每个片段
                    rawUrls.splitToSequence("#")
                        .forEachIndexed { index, part ->
                            val trimmedPart = part.trim()
                            when {
                                // 检测到webview协议开头，开始拼接
                                trimmedPart.startsWith("webview://") -> {
                                    currentWebViewUrl.clear()
                                    currentWebViewUrl.append(trimmedPart)
                                }
                                // 当前正在拼接webview链接，追加后续部分
                                currentWebViewUrl.isNotEmpty() -> {
                                    currentWebViewUrl.append("#").append(trimmedPart)
                                }
                                // 普通URL直接添加（且非空）
                                else -> {
                                    if (trimmedPart.isNotEmpty()) {
                                        urls.add(trimmedPart)
                                    }
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
                            IptvParser.ChannelItem.HybridType.None
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
