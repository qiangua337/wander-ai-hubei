export type Destination = {
  id: string; title: string; english: string; region: string; category: 'nature' | 'city'; image: string; imageAlt: string;
  tag: string; duration: string; description: string; overview: string; itinerary: string[]; imagePosition?: string;
};
export const destinations: Destination[] = [
  {
    id: 'enshi', title: '恩施大峡谷', english: 'ENSHI GRAND CANYON', region: '湖北 · 恩施', category: 'nature', image: '/images/enshi.jpg', imageAlt: '湖北恩施大峡谷的喀斯特石柱与群峰',
    tag: '山水秘境', duration: '3 天 2 晚', description: '穿行绝壁与云海，让群山收藏你的脚步。',
    overview: '在七星寨看群峰与石柱，在云龙地缝听水声回响。把一天留给峡谷，也把慢下来的时间留给恩施的街巷。',
    itinerary: ['抵达恩施，漫游老街与土家风情街巷。', '前往恩施大峡谷，安排七星寨或云龙地缝徒步。', '品尝当地风味，留出返程与休息时间。'], imagePosition: '62% center',
  },
  {
    id: 'shennongjia', title: '神农架', english: 'SHENNONGJIA', region: '湖北 · 神农架林区', category: 'nature', image: '/images/shennongjia.jpg', imageAlt: '湖北神农架大九湖湿地公园中的绿色森林与木栈道',
    tag: '森林慢游', duration: '4 天 3 晚', description: '走进林间的绿意，赴一场与自然的约会。',
    overview: '沿木栈道走进大九湖湿地，在神农架的森林与山峦之间寻找安静。用宽松的节奏探索，让天气与自然决定旅途的惊喜。',
    itinerary: ['抵达木鱼镇，休息并了解景区交通。', '根据天气选择神农顶一带的观景线路。', '前往大九湖湿地，沿指定步道慢行。', '留半天自由活动，从容返程。'],
  },
  {
    id: 'wuhan', title: '武汉 · 黄鹤楼', english: 'WUHAN · YELLOW CRANE TOWER', region: '湖北 · 武汉', category: 'city', image: '/images/yellow-crane.jpg', imageAlt: '武汉黄鹤楼夜间灯光照亮金色飞檐',
    tag: '千年楚韵', duration: '2 天 1 晚', description: '登楼望江，在江城烟火里读懂荆楚。',
    overview: '以黄鹤楼为起点，走进武昌的老街与长江岸线。白天看飞檐与江景，傍晚在江边散步，把热干面与城市记忆一起带走。',
    itinerary: ['黄鹤楼与武昌老街漫游，傍晚走向长江岸线。', '品尝武汉过早，东湖散步后返程。'], imagePosition: 'center 38%',
  },
];

export const imageCredits = [
  { subject: '西陵峡 · 灯影峡', author: 'Neil Young', source: 'https://commons.wikimedia.org/wiki/File:Dengying_Gorge_of_Yangtze_River.jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  { subject: '恩施大峡谷', author: '作者未署名 / Wikimedia Commons', source: 'https://commons.wikimedia.org/wiki/File:Enshi_grand_canyon.jpg', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { subject: '神农架大九湖湿地公园', author: 'Z Zzl', source: 'https://commons.wikimedia.org/wiki/File:湖北神农架大九湖湿地公园_-_panoramio.jpg', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  { subject: '黄鹤楼夜景', author: 'Rock211lee（上传者；来源页未另署作者）', source: 'https://commons.wikimedia.org/wiki/File:夜の黄鶴楼.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
];

export const stories = [
  { name: '小林', theme: '恩施 · 山水徒步', initial: '林', color: 'bg-[#e8e9db] text-[#66743e]', title: '把时间留给沿途的风景', quote: '“不用再在十几个页面之间来回切换。把想去的地方放在一起，出发这件事也变得轻盈了。”' },
  { name: '阿然', theme: '神农架 · 自然慢游', initial: '然', color: 'bg-[#dce9e3] text-[#477363]', title: '找到属于自己的旅行节奏', quote: '“我们想去森林里慢慢走，而不是赶着打卡。能按自己的喜好整理行程，这才是理想中的假期。”' },
  { name: '晓晓', theme: '武汉 · 城市漫游', initial: '晓', color: 'bg-[#f4e3dc] text-[#a66f59]', title: '一次轻松的周末出走', quote: '“登黄鹤楼、逛老街、到江边吹吹风。一个周末也可以装下很多美好的瞬间。”' },
];
