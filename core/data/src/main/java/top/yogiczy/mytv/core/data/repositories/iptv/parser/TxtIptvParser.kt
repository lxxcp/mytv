package top.yogiczy.mytv.core.data.repositories.iptv.parser

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * txt直播源解析
 */
class TxtIptvParser : IptvParser {

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

                    val rawUrls = res[1].trim()
                    
                    // 根据前缀判断是否分割
                    val urls = if (rawUrls.startsWith("webview://")) {
                        listOf(rawUrls)
                    } else {
                        rawUrls.split("#").map { it.trim() }
                    }

                    urls.forEach { url ->
                        if (url.isBlank()) return@forEach
                        
                        channelList.add(
                            IptvParser.ChannelItem(
                                name = res[0].trim(),
                                groupName = groupName ?: "其他",
                                url = url,
                            )
                        )
                    }
                }
            }

            channelList
        }
}
