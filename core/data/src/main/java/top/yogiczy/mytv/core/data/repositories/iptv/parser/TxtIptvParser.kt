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

                    val name = res[0].trim()
                    val rawUrls = res[1].trim()

                    // 关键逻辑：仅当不以webview://开头时，才用#分割
                    val urls = if (rawUrls.startsWith("webview://")) {
                        listOf(rawUrls) // WebView链接直接保留完整
                    } else {
                        rawUrls.split("#").map { it.trim() } // 其他链接按#分割
                    }

                    // 生成ChannelItem列表
                    urls.forEach { url ->
                        if (url.isBlank()) return@forEach

                        val hybridType = if (url.startsWith("webview://")) {
                            logger.i("检测到WebView链接: $url")
                            IptvParser.ChannelItem.HybridType.WebView
                        } else {
                            IptvParser.ChannelItem.HybridType.None
                        }

                        channelList.add(
                            IptvParser.ChannelItem(
                                name = name,
                                groupName = groupName ?: "其他",
                                url = url,
                                hybridType = hybridType
                            )
                        )
                    }
                }
            }

            channelList
        }
}
