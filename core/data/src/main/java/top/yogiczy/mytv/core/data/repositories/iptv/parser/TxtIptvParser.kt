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

                    // 解析每一组URL（支持多个URL以#分隔）
                    res[1].split("#").forEach { rawUrl ->
                        val trimmedUrl = rawUrl.trim()
                        val hybridType = if (trimmedUrl.startsWith("webview://")) {
                            logger.i("检测到WebView链接: $trimmedUrl")
                            logger.i("将hybridType设置为WebView")
                            IptvParser.ChannelItem.HybridType.WebView
                        } else {
                            IptvParser.ChannelItem.HybridType.None // 假设存在默认值None
                        }

                        channelList.add(
                            IptvParser.ChannelItem(
                                name = res[0].trim(),
                                groupName = groupName ?: "其他",
                                url = trimmedUrl,
                                hybridType = hybridType // 确保非空
                            )
                        )
                    }
                }
            }

            channelList
        }
}