package top.yogiczy.mytv.core.data.utils

import top.yogiczy.mytv.core.data.entities.channel.ChannelLine
import top.yogiczy.mytv.core.data.entities.channel.ChannelLineList


object ChannelUtil {
    private val hybridWebViewUrl by lazy {
        mapOf(
            ChannelAlias.standardChannelName("CCTV4K 超高清") to listOf(
                 "https://yangshipin.cn/tv/home?pid=600002264",
            ),
             ChannelAlias.standardChannelName("CCTV8K 超高清") to listOf(
                 "https://yangshipin.cn/tv/home?pid=600156816",
            ),
            ChannelAlias.standardChannelName("CCTV-1 综合") to listOf(
                 "https://yangshipin.cn/tv/home?pid=600001859",
                 "https://tv.cctv.com/live/cctv1/",
            ),
            ChannelAlias.standardChannelName("CCTV-2 财经") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001800",
                "https://tv.cctv.com/live/cctv2/",
            ),
            ChannelAlias.standardChannelName("CCTV-3 综艺") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001801",
                "https://tv.cctv.com/live/cctv3/",
            ),
            ChannelAlias.standardChannelName("CCTV-4 中文国际") to listOf(
               "https://yangshipin.cn/tv/home?pid=600001814",
               "https://tv.cctv.com/live/cctv4/",
            ),
            ChannelAlias.standardChannelName("CCTV-5 体育") to listOf(
               "https://yangshipin.cn/tv/home?pid=600001818",
               "https://tv.cctv.com/live/cctv5/",
            ),
            ChannelAlias.standardChannelName("CCTV-5+ 体育赛事") to listOf(
               "https://yangshipin.cn/tv/home?pid=600001817",
               "https://tv.cctv.com/live/cctv5plus/",
            ),
            ChannelAlias.standardChannelName("CCTV-6 电影") to listOf(
                "https://tv.cctv.com/live/cctv6/",
                "https://yangshipin.cn/tv/home?pid=600108442"
            ),
            ChannelAlias.standardChannelName("CCTV-7 国防军事") to listOf(
                "https://tv.cctv.com/live/cctv7/",
                "https://yangshipin.cn/tv/home?pid=600004092",
            ),
            ChannelAlias.standardChannelName("CCTV-8 电视剧") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001803",
                     "https://tv.cctv.com/live/cctv8/",
            ),
            ChannelAlias.standardChannelName("CCTV-9 纪录") to listOf(
                "https://yangshipin.cn/tv/home?pid=600004078",
                "https://tv.cctv.com/live/cctvjilu/",               
            ),
            ChannelAlias.standardChannelName("CCTV-10 科教") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001805",
                "https://tv.cctv.com/live/cctv10/",                
            ),
            ChannelAlias.standardChannelName("CCTV-11 戏曲") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001806",
                "https://tv.cctv.com/live/cctv11/",             
            ),
            ChannelAlias.standardChannelName("CCTV-12 社会与法") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001807",
                "https://tv.cctv.com/live/cctv12/",                
            ),
            ChannelAlias.standardChannelName("CCTV-13 新闻") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001811",
                "https://tv.cctv.com/live/cctv13/",                
            ),
            ChannelAlias.standardChannelName("CCTV-14 少儿") to listOf(
                 "https://yangshipin.cn/tv/home?pid=600001809",
                "https://tv.cctv.com/live/cctvchild/",
            ),
            ChannelAlias.standardChannelName("CCTV-15 音乐") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001815",
                "https://tv.cctv.com/live/cctv15/",                
            ),
            ChannelAlias.standardChannelName("CCTV-16 奥林匹克") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099502",
                "https://yangshipin.cn/tv/home?pid=600098637",
                "https://tv.cctv.com/live/cctv16/",                
            ),
            ChannelAlias.standardChannelName("CCTV-17 农业农村") to listOf(
                "https://yangshipin.cn/tv/home?pid=600001810", 
                "https://tv.cctv.com/live/cctv17/",                
            ),
             ChannelAlias.standardChannelName("CCTV-4 中文国际欧洲") to listOf(
                "https://tv.cctv.com/live/cctveurope/index.shtml",
            ),
             ChannelAlias.standardChannelName("CCTV-4 中文国际美洲") to listOf(
                "https://tv.cctv.com/live/cctvamerica/",
            ),
            ChannelAlias.standardChannelName("CGTN") to listOf(
                "https://yangshipin.cn/tv/home?pid=600014550",
            ),
            ChannelAlias.standardChannelName("CGTN纪录") to listOf(
                "https://yangshipin.cn/tv/home?pid=600084781",
            ),
            ChannelAlias.standardChannelName("CGTN俄语") to listOf(
                "https://yangshipin.cn/tv/home?pid=600084758",
            ),
            ChannelAlias.standardChannelName("CGTN法语") to listOf(
                "https://yangshipin.cn/tv/home?pid=600084704",
            ),
            ChannelAlias.standardChannelName("CGTN西语") to listOf(
                "https://yangshipin.cn/tv/home?pid=600084744",
            ),
            ChannelAlias.standardChannelName("CGTN阿语") to listOf(
                "https://yangshipin.cn/tv/home?pid=600084782",
            ),
            ChannelAlias.standardChannelName("CCTV风云剧场") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099658",
            ),
            ChannelAlias.standardChannelName("CCTV第一剧场") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099655",
            ),
            ChannelAlias.standardChannelName("CCTV怀旧剧场") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099620",
            ),
            ChannelAlias.standardChannelName("CCTV世界地理") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099637",
            ),
            ChannelAlias.standardChannelName("CCTV风云音乐") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099660",
            ),
            ChannelAlias.standardChannelName("CCTV兵器科技") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099649",
            ),
            ChannelAlias.standardChannelName("CCTV风云足球") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099636",
            ),
            ChannelAlias.standardChannelName("CCTV高尔夫网球") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099659",
            ),
            ChannelAlias.standardChannelName("CCTV女性时尚") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099650",
            ),
            ChannelAlias.standardChannelName("CCTV央视文化精品") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099653",
            ),
            ChannelAlias.standardChannelName("CCTV央视台球") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099652",
            ),
            ChannelAlias.standardChannelName("CCTV电视指南") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099656",
            ),
            ChannelAlias.standardChannelName("CCTV卫生健康") to listOf(
                "https://yangshipin.cn/tv/home?pid=600099651",
            ),
            ChannelAlias.standardChannelName("北京卫视") to listOf(
                "https://www.brtn.cn/btv/btvsy_index",
                "https://yangshipin.cn/tv/home?pid=600002309"
            ),
            ChannelAlias.standardChannelName("江苏卫视") to listOf(
                "https://live.jstv.com/",
                "https://yangshipin.cn/tv/home?pid=600002521"
            ),
            ChannelAlias.standardChannelName("东方卫视") to listOf(
                 "https://yangshipin.cn/tv/home?pid=600002483",
                "https://www.gdtv.cn/tvChannelDetail/43"
            ),
            ChannelAlias.standardChannelName("浙江卫视") to listOf(
                "https://www.cztv.com/liveTV",
                "https://yangshipin.cn/tv/home?pid=600002520"
            ),
            ChannelAlias.standardChannelName("湖南卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600002475"
            ),
            ChannelAlias.standardChannelName("湖北卫视") to listOf(
                "https://news.hbtv.com.cn/app/tv/431",
                "https://yangshipin.cn/tv/home?pid=600002508",
            ),
            ChannelAlias.standardChannelName("广东卫视") to listOf(
                "https://www.gdtv.cn/tvChannelDetail/43",
                "https://yangshipin.cn/tv/home?pid=600002485"
            ),
            ChannelAlias.standardChannelName("广西卫视") to listOf(
                "https://tv.gxtv.cn/channel/channelivePlay_e7a7ab7df9fe11e88bcfe41f13b60c62.html",
                "https://yangshipin.cn/tv/home?pid=600002509"
            ),
            ChannelAlias.standardChannelName("黑龙江卫视") to listOf(
                "https://www.hljtv.com/live/",
                "https://yangshipin.cn/tv/home?pid=600002498"
            ),
            ChannelAlias.standardChannelName("海南卫视") to listOf(
                "http://tc.hnntv.cn/zb/28666112.shtml",
                "https://yangshipin.cn/tv/home?pid=600002506"
            ),
            ChannelAlias.standardChannelName("重庆卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600002531",
            ),
            ChannelAlias.standardChannelName("四川卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600002516"
            ),
            ChannelAlias.standardChannelName("河南卫视") to listOf(
                "https://static.hntv.tv/kds/#/",
                "https://yangshipin.cn/tv/home?pid=600002525"
            ),
            ChannelAlias.standardChannelName("东南卫视") to listOf(
                "http://www.setv.fjtv.net/live/",
                "https://yangshipin.cn/tv/home?pid=600002484"
            ),
            ChannelAlias.standardChannelName("贵州卫视") to listOf(
                "https://www.gzstv.com/tv/ch01",
                "https://yangshipin.cn/tv/home?pid=600002490"
            ),
            ChannelAlias.standardChannelName("江西卫视") to listOf(
                "https://www.jxntv.cn/live/#/jxtv1",
                "https://yangshipin.cn/tv/home?pid=600002503"
            ),
            ChannelAlias.standardChannelName("辽宁卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600002505"
            ),
            ChannelAlias.standardChannelName("安徽卫视") to listOf(
                "https://www.ahtv.cn/folder9000/folder20193?channelIndex=0",
                "https://yangshipin.cn/tv/home?pid=600002532"
            ),
            ChannelAlias.standardChannelName("河北卫视") to listOf(
                "https://www.hebtv.com/19/19js/st/xdszb/index.shtml?index=0",
                "https://yangshipin.cn/tv/home?pid=600002493"
            ),
            ChannelAlias.standardChannelName("山东卫视") to listOf(
                "https://v.iqilu.com/live/sdtv/",
                "https://yangshipin.cn/tv/home?pid=600002513"
            ),
            ChannelAlias.standardChannelName("天津卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600152137"
            ),
            ChannelAlias.standardChannelName("吉林卫视") to listOf(
                "https://www.jlntv.cn/tv?id=104",
                "https://yangshipin.cn/tv/home?pid=600190405"
            ),
            ChannelAlias.standardChannelName("陕西卫视") to listOf(
                "http://live.snrtv.com/star",
                "https://yangshipin.cn/tv/home?pid=600190400"
            ),
            ChannelAlias.standardChannelName("甘肃卫视") to listOf(
                "https://www.gstv.com.cn/zxc.jhtml",
                "https://yangshipin.cn/tv/home?pid=600190408"
            ),
            ChannelAlias.standardChannelName("宁夏卫视") to listOf(
                "https://www.nxtv.com.cn/tv/ws/",
                "https://yangshipin.cn/tv/home?pid=600190737"
            ),
            ChannelAlias.standardChannelName("内蒙古卫视") to listOf(
                "https://www.nmtv.cn/liveTv",
                "https://yangshipin.cn/tv/home?pid=600190401"
            ),
            ChannelAlias.standardChannelName("云南卫视") to listOf(
                "https://www.yntv.cn/live.html",
                "https://yangshipin.cn/tv/home?pid=600190402"
            ),
            ChannelAlias.standardChannelName("山西卫视") to listOf(
                "https://www.sxrtv.com/tv/",
                "https://yangshipin.cn/tv/home?pid=600190407"
            ),
            ChannelAlias.standardChannelName("青海卫视") to listOf(
                "https://www.qhbtv.com/new_index/live/folder2646/",
                "https://yangshipin.cn/tv/home?pid=600190406"
            ),
            ChannelAlias.standardChannelName("西藏卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600190403"
            ),
            ChannelAlias.standardChannelName("新疆卫视") to listOf(
                "https://www.xjtvs.com.cn/column/tv/434",
                "https://yangshipin.cn/tv/home?pid=600152138"
            ),
            ChannelAlias.standardChannelName("兵团卫视") to listOf(
                "https://yangshipin.cn/tv/home?pid=600193252",
            ),
            ChannelAlias.standardChannelName("大湾区卫视") to listOf(
                "https://www.gdtv.cn/tvChannelDetail/51",
            ),
            ChannelAlias.standardChannelName("深圳卫视") to listOf(
                "https://www.sztv.com.cn/dianshi.shtml?id=7867",
            ),
            ChannelAlias.standardChannelName("三沙卫视") to listOf(
                "https://www.hnntv.cn/live.html?playType=livePlay&channelId=5",
            ),
            ChannelAlias.standardChannelName("延边卫视") to listOf(
                "https://www.yb983.com/cys/",
            ),
            ChannelAlias.standardChannelName("康巴卫视") to listOf(
                "https://www.kangbatv.com/zb_22587/",
            ),
             ChannelAlias.standardChannelName("山东教育") to listOf(
                "https://www.sdetv.com.cn/edu/pc/live/index.html",
            ),
             ChannelAlias.standardChannelName("嘉佳卡通") to listOf(
                "https://www.gdtv.cn/tvChannelDetail/66",
            ),
             ChannelAlias.standardChannelName("哈哈炫动") to listOf(
                "https://live.kankanews.com/huikan?id=9",
            ),
             ChannelAlias.standardChannelName("优漫卡通") to listOf(
                "https://live.jstv.com/?channelId=543",
            ),
            ChannelAlias.standardChannelName("第一财经") to listOf(
                "https://live.kankanews.com/huikan?id=5",
            ),
             ChannelAlias.standardChannelName("南昌新闻综合") to listOf(
                "https://www.nctv.net.cn/live?channel=1",
            ),
            ChannelAlias.standardChannelName("南昌都市") to listOf(
                "https://www.nctv.net.cn/live?channel=2",
            ),ChannelAlias.standardChannelName("南昌资讯") to listOf(
                "https://www.nctv.net.cn/live?channel=3",
            ),
            ChannelAlias.standardChannelName("CETV-1 综合教育") to listOf(
                "https://yangshipin.cn/tv/home?pid=600171827",
                "https://tv.gxtv.cn/channel/channelivePlay_ffa6b6e1b32b4a16a73eb3ef66f8bfc7.html",
            ),
            ChannelAlias.standardChannelName("CETV-2 空中课堂") to listOf(
                "https://tv.gxtv.cn/channel/channelivePlay_80d0ffb42c114eaf9663708629ff0a3e.html",
            ),
            ChannelAlias.standardChannelName("CETV-4 职业教育") to listOf(
                "https://tv.gxtv.cn/channel/channelivePlay_67eace939278435bb4bca90800fb4225.html",
            ),
        )
    }

    fun getHybridWebViewLines(channelName: String): ChannelLineList {
        return ChannelLineList(hybridWebViewUrl[ChannelAlias.standardChannelName(channelName)]
            ?.map { ChannelLine(url = "webview://$it") }
            ?: emptyList())
    }

    fun getHybridWebViewUrlProvider(url: String): String {
        return if (url.contains("https://tv.cctv.com")) "央视网"
        else if (url.contains("https://yangshipin.cn")) "央视频"
        else "未知"
    }

    fun urlSupportPlayback(url: String): Boolean {
        return listOf("pltv", "tvod").any { url.contains(it, ignoreCase = true) }
    }

    fun urlToCanPlayback(url: String): String {
        return url.replace("pltv", "tvod", ignoreCase = true)
    }
}
