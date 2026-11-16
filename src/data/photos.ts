import type { PhotoCredit } from './types';
import { extraPhotos } from './extraPhotos';

export const editorialPhotos = {
  xiling: { filename: 'xiling-river-1920.webp', subject: '西陵峡', alt: '湖北宜昌西陵峡的长江江面和两岸崖壁', author: 'Fredlyfish4', source: 'https://commons.wikimedia.org/wiki/File:Xiling_Gorge_2016_3.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  yellowCrane: { filename: 'yellow-crane-day.webp', subject: '黄鹤楼', alt: '武汉黄鹤楼的飞檐立在蛇山树林与城市天际线之间', author: 'Gary Todd', source: 'https://commons.wikimedia.org/wiki/File:Yellow_Crane_Tower,_Wuhan_(10160098704).jpg', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  wudang: { filename: 'wudang-golden-hall.webp', subject: '武当山金殿', alt: '湖北武当山金殿正面、铜构飞檐与两侧红墙', author: 'Xiquinho Silva', source: 'https://commons.wikimedia.org/wiki/File:Wudang_Mountain_(54130226097).jpg', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' },
  enshi: { filename: 'enshi-gorge-walls.webp', subject: '恩施大峡谷', alt: '湖北恩施大峡谷两侧的高耸岩壁与绿树', author: 'HoweyYuan', source: 'https://commons.wikimedia.org/wiki/File:Enshi_Grand_Canyon_20240725.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  noodles: { filename: 'wuhan-hot-dry-noodles.webp', subject: '武汉热干面', alt: '白瓷碗里的武汉热干面，上面撒有葱和配料', author: 'Zheng Zhou', source: 'https://commons.wikimedia.org/wiki/File:Hot_Dry_Noodles.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  bells: { filename: 'marquis-yi-bells.webp', subject: '湖北省博物馆 · 曾侯乙编钟', alt: '湖北省博物馆展出的曾侯乙编钟与钟架', author: 'YouTable', source: 'https://commons.wikimedia.org/wiki/File:湖北博物館曾侯乙編鐘.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  eastLake: { filename: 'wuhan-east-lake.webp', subject: '武汉东湖', alt: '武汉东湖的开阔湖面与林岸', author: 'Fxqf', source: 'https://commons.wikimedia.org/wiki/File:Wuhan_East_Lake_01.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  jianghan: { filename: 'wuhan-jianghan-road.webp', subject: '武汉江汉路', alt: '武汉江汉路步行街两边的建筑', author: "The Fool's Age of Wandering", source: 'https://commons.wikimedia.org/wiki/File:江汉路_Jianghan_Road_(5425005052).jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  mulan: { filename: 'mulan-tianchi.webp', subject: '木兰天池 · 大天池', alt: '武汉黄陂木兰天池的大天池、湖中小屋与青山', author: 'Wang31', source: 'https://commons.wikimedia.org/wiki/File:木兰天池_2024-04-24.jpg', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  dam: { filename: 'three-gorges-dam.webp', subject: '宜昌三峡大坝', alt: '从观景处远眺宜昌三峡大坝与坝顶起重设施', author: 'Nyx Ning', source: 'https://commons.wikimedia.org/wiki/File:三峡-远眺三峡大坝_-_panoramio.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  tribe: { filename: 'three-gorges-tribe.webp', subject: '宜昌三峡人家', alt: '宜昌三峡人家景区的碧绿水道、林岸与帆船', author: 'Zbingo', source: 'https://commons.wikimedia.org/wiki/File:长江三峡最美的地方-三峡人家.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  waterfall: { filename: 'three-gorges-waterfall.webp', subject: '三峡大瀑布', alt: '宜昌三峡大瀑布从岩壁落入潭水', author: 'Fxqf', source: 'https://commons.wikimedia.org/wiki/File:宜昌三峡大瀑布.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
} satisfies Record<string, PhotoCredit>;

export const imageCredits: PhotoCredit[] = [
  { filename: 'xiling.jpg', cityId: 'yichang', subject: '西陵峡 · 灯影峡', alt: '湖北宜昌西陵峡灯影峡的长江、山峦与临江亭阁', author: 'Neil Young', source: 'https://commons.wikimedia.org/wiki/File:Dengying_Gorge_of_Yangtze_River.jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  { filename: 'enshi.jpg', cityId: 'enshi', subject: '恩施大峡谷', alt: '湖北恩施大峡谷的喀斯特石柱与群峰', author: '作者未署名 / Wikimedia Commons', source: 'https://commons.wikimedia.org/wiki/File:Enshi_grand_canyon.jpg', license: 'CC0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  { filename: 'shennongjia.jpg', cityId: 'shennongjia', subject: '神农架大九湖湿地公园', alt: '湖北神农架大九湖湿地公园中的绿色森林与木栈道', author: 'Z Zzl', source: 'https://commons.wikimedia.org/wiki/File:湖北神农架大九湖湿地公园_-_panoramio.jpg', license: 'CC BY 3.0', licenseUrl: 'https://creativecommons.org/licenses/by/3.0/' },
  { filename: 'yellow-crane.jpg', cityId: 'wuhan', subject: '黄鹤楼夜景', alt: '武汉黄鹤楼夜间灯光照亮金色飞檐', author: 'Rock211lee（上传者；来源页未另署作者）', source: 'https://commons.wikimedia.org/wiki/File:夜の黄鶴楼.jpg', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  { filename: 'popular-wudang.jpg', cityId: 'shiyan', subject: '武当山金殿', alt: '湖北十堰武当山金殿的铜构建筑与飞檐', author: 'gongfu_king', source: 'https://commons.wikimedia.org/wiki/File:Wudangshan_pic_9.jpg', license: 'CC BY-SA 2.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0/' },
  { filename: 'popular-xiangyang.jpg', cityId: 'xiangyang', subject: '襄阳古城 · 临汉门', alt: '湖北襄阳古城临汉门城楼与城墙', author: 'Yumeto', source: 'https://commons.wikimedia.org/wiki/File:20250525_Linhan_Men.jpg', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  ...extraPhotos,
  ...Object.values(editorialPhotos),
];
export const cityPhotos = Object.fromEntries(imageCredits.filter(photo => photo.cityId).map(photo => [photo.cityId, photo])) as Record<string, PhotoCredit>;
export const destinationPhotos: Record<string, PhotoCredit | undefined> = {
  wuhan: editorialPhotos.yellowCrane, enshi: cityPhotos.enshi, shennongjia: cityPhotos.shennongjia, 'xiling-gorge': cityPhotos.yichang,
  wudang: editorialPhotos.wudang, 'hubei-museum': editorialPhotos.bells, 'xiangyang-old-town': cityPhotos.xiangyang,
  'east-lake': editorialPhotos.eastLake, hankou: editorialPhotos.jianghan, mulan: editorialPhotos.mulan,
  'three-gorges-dam': editorialPhotos.dam, 'three-gorges-tribe': editorialPhotos.tribe, 'three-gorges-waterfall': editorialPhotos.waterfall,
  'jingzhou-wall': cityPhotos.jingzhou, xianling: cityPhotos.jingmen, dongpo: cityPhotos.huanggang,
  tonglvshan: cityPhotos.huangshi, jiugong: cityPhotos.xianning, 'ezhou-xishan': cityPhotos.ezhou,
};

export function displayPhoto(image: string | undefined, wide = false): string | undefined {
  if (image === '/images/xiling.jpg') return wide ? '/images/xiling-cover-1600.webp' : '/images/xiling-cover-768.webp';
  if (image === '/images/enshi.jpg') return '/images/enshi-card.webp';
  if (image === '/images/shennongjia.jpg') return '/images/shennongjia-boardwalk.webp';
  return image;
}
