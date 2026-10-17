export const placeContexts: Record<string, string> = {
  wuhan: '登楼看长江、蛇山与大桥，再沿武昌老街走到江边。',
  'xiling-gorge': '在长江三峡的西陵峡段，看江流、山势与沿岸聚落。',
  wudang: '宫观顺山势展开。金顶、南岩与紫霄，适合分线慢看。',
  enshi: '七星寨看峰丛与石柱，云龙地缝看岩层；按体力选片区。',
  'xiangyang-old-town': '循昭明台至临汉门，读城墙、街巷与汉江的关系。',
  shennongjia: '在大九湖观察湿地、草甸与林缘，走一段自然的过渡。',
};

export const culturalChapters = [
  {
    id: 'ritual', label: '礼乐 · 青铜与声音', mark: '礼乐', title: '从一组编钟，听见礼乐。',
    intro: '1978 年，曾侯乙编钟在随州出土。全套 65 件，铭文记录了音律知识。先在湖北省博物馆读器形、铭文与声音的关系，再到随州认识曾随地方历史。',
    points: ['看钟架的分层、成组悬挂与铸造细节', '把出土地、收藏地与今天的展示分清楚', '按馆内标识区分原件、复制展示与演奏用钟'],
    image: '/images/suizhou-bells.jpg', alt: '随州出土的擂鼓墩二号墓编钟',
    caption: '图为擂鼓墩二号墓编钟，与曾侯乙编钟是不同的一组器物。',
    placeIds: ['hubei-museum', 'suizhou-museum'],
    reading: '先读文物，再走城市；参观前核对展区、预约与讲解安排。',
    source: { title: '湖北省博物馆 · 曾侯乙编钟', url: 'https://www.hbww.org.cn/zgzb/p/4695.html' },
  },
  {
    id: 'river', label: '江流 · 地理与生活', mark: '江流', title: '沿着长江，看山河与生活。',
    intro: '从西陵峡的山势与水道，到秭归的屈原祠与迁建文物，峡江旅行也能读出文学与聚落的线索。先看江岸，再把三峡工程放回同一条长江里理解。',
    points: ['在岸上看山势，在船上看水道与聚落', '把屈原文化与峡江迁建文物联系起来', '船游的码头、停靠点与所含线路分别核对'],
    image: '/images/xiling.jpg', alt: '宜昌西陵峡灯影峡的江流、山峦与临江亭阁',
    caption: '西陵峡 · 灯影峡。实拍视角不等于每条游船的实际航线。',
    placeIds: ['xiling-gorge', 'quyuan'],
    reading: '可以把大坝与屈原故里顺路组合，岸线与船游则按实际交通取舍。',
    source: { title: '宜昌市政府 · 三峡大坝—屈原故里旅游区', url: 'https://www.yichang.gov.cn/content-32045-1001487-1.html' },
  },
  {
    id: 'city', label: '城郭 · 不同年代的记忆', mark: '城郭', title: '在荆州，把时间分层看。',
    intro: '荆州的楚文化、三国记忆与现存城墙，属于不同的时间层。先在博物馆看地方考古与漆木器，再沿城门与护城河步行，让馆里的器物与城中的空间互相印证。',
    points: ['在博物馆细看一组器物，不必走马观花', '沿城门、城墙与护城河理解城市格局', '不把今天看到的城墙都当作三国原物'],
    image: '/images/jingzhou.jpg', alt: '荆州古城东门宾阳楼与城墙',
    caption: '荆州古城 · 宾阳楼。楚文化、三国叙事与现存城墙需要分开理解。',
    placeIds: ['jingzhou-museum', 'jingzhou-wall'],
    reading: '半天读馆、半天走城；具体登城与夜游安排，出发前再查官方开放信息。',
    source: { title: '湖北省政府 · 荆州楚文化线路', url: 'https://media.hubei.gov.cn/zyxmt/push/weixin/202307/t20230724_4764864.shtml' },
  },
];