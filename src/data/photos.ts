import type { PhotoCredit } from './types';
import { extraPhotos } from './extraPhotos';
export const imageCredits: PhotoCredit[] = [
  { filename: 'xiling.jpg', cityId: 'yichang', subject: '西陵峡 · 灯影峡', alt: '湖北宜昌西陵峡灯影峡的长江、山峦与临江亭阁', author: 'Neil Young', source: 'https://commons.wikimedia.org/wiki/File:Dengying_Gorge_of_Yangtze_River.jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  { filename: 'enshi.jpg', cityId: 'enshi', subject: '恩施大峡谷', alt: '湖北恩施大峡谷的喀斯特石柱与群峰', author: '作者未署名 / Wikimedia Commons', source: 'https://commons.wikimedia.org/wiki/File:Enshi_grand_canyon.jpg', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { filename: 'shennongjia.jpg', cityId: 'shennongjia', subject: '神农架大九湖湿地公园', alt: '湖北神农架大九湖湿地公园中的绿色森林与木栈道', author: 'Z Zzl', source: 'https://commons.wikimedia.org/wiki/File:湖北神农架大九湖湿地公园_-_panoramio.jpg', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  { filename: 'yellow-crane.jpg', cityId: 'wuhan', subject: '黄鹤楼夜景', alt: '武汉黄鹤楼夜间灯光照亮金色飞檐', author: 'Rock211lee（上传者；来源页未另署作者）', source: 'https://commons.wikimedia.org/wiki/File:夜の黄鶴楼.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  { filename: 'popular-wudang.jpg', cityId: 'shiyan', subject: '武当山金殿', alt: '湖北十堰武当山金殿的铜构建筑与飞檐', author: 'gongfu_king', source: 'https://commons.wikimedia.org/wiki/File:Wudangshan_pic_9.jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  { filename: 'popular-xiangyang.jpg', cityId: 'xiangyang', subject: '襄阳古城 · 临汉门', alt: '湖北襄阳古城临汉门城楼与城墙', author: 'Yumeto', source: 'https://commons.wikimedia.org/wiki/File:20250525_Linhan_Men.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  ...extraPhotos,
];
export const cityPhotos = Object.fromEntries(imageCredits.map(photo => [photo.cityId, photo])) as Record<string, PhotoCredit>;
export const destinationPhotos: Record<string, PhotoCredit | undefined> = {
  wuhan: cityPhotos.wuhan, enshi: cityPhotos.enshi, shennongjia: cityPhotos.shennongjia, 'xiling-gorge': cityPhotos.yichang,
  wudang: cityPhotos.shiyan, 'xiangyang-old-town': cityPhotos.xiangyang,
  'jingzhou-wall': cityPhotos.jingzhou, xianling: cityPhotos.jingmen, dongpo: cityPhotos.huanggang,
  tonglvshan: cityPhotos.huangshi, jiugong: cityPhotos.xianning, 'ezhou-xishan': cityPhotos.ezhou,
};
