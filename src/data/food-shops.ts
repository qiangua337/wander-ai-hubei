import { district, mapPlace, type PracticalMapLink } from './practical-maps';
import type { Source } from './types';

export type FoodMeal = 'breakfast' | 'meal' | 'snack';
export const foodMealLabels: Record<FoodMeal, string> = { breakfast: '过早早餐', meal: '午晚正餐', snack: '街边小吃' };
export type LocalFoodShop = {
  id: string;
  name: string;
  meals: readonly FoodMeal[];
  neighborhoods: readonly string[];
  area: string;
  address: string;
  dish: string;
  routeFit: string;
  evidence: string;
  sources: readonly Source[];
  map: PracticalMapLink;
};

export const localFoodShops: Partial<Record<string, readonly LocalFoodShop[]>> = {
  jingzhou: [
    {
      id: 'jingzhou-laojiefang',
      name: '老街坊饭庄（张居正街店）',
      meals: ['meal'],
      neighborhoods: ['荆州古城', '古城东门', '张居正街', '张居正故居', '宾阳楼'],
      area: '荆州古城东门 · 午餐或晚餐',
      address: '荆州区张居正街18号，近黄金堂路口',
      dish: '砂锅鸡汤，或加一道荆沙鱼糕',
      routeFit: '逛完宾阳楼和张居正故居，在同一条街用餐。两人可以先问鸡汤分量。',
      evidence: '荆州日报的美食指南列了这家的鸡汤和家常菜，公开菜单也列有砂锅鸡汤和荆沙鱼糕。',
      sources: [
        { title: '荆州日报美食指南', url: 'https://m.thepaper.cn/baijiahao_10468280' },
        { title: '门店菜单与点评', url: 'https://you.ctrip.com/food/jingzhou413/130190137-dianping.html' },
      ],
      map: mapPlace('老街坊饭庄（张居正街店）', 'B0FFIR0V1E'),
    },
    {
      id: 'jingzhou-fushou',
      name: '福寿早堂面（江汉南路店）',
      meals: ['breakfast'],
      neighborhoods: ['沙市', '江汉南路', '沙市老街', '沙市码头'],
      area: '沙市 · 早餐',
      address: '沙市区江汉南路182号',
      dish: '高汤大连面',
      routeFit: '住沙市或准备走沙市老街时顺路。若早上从荆州博物馆一带出发，可以在古城就近过早。',
      evidence: '纪录片《早餐中国》到这家店拍过大连面，湖北日报客户端的荆州早餐报道也列出这家分店。',
      sources: [
        { title: '《早餐中国》拍摄资料', url: 'https://www.sina.cn/news/detail/4441443047699221.html' },
        { title: '湖北日报早餐报道', url: 'https://news.hubeidaily.net/mobile/c_2036800.html' },
      ],
      map: district('沙市区', '421002', '福寿早堂面（江汉南路店）'),
    },
  ],
  wuhan: [
    {
      id: 'wuhan-xiashi',
      name: '夏氏砂锅（雪松路总店）',
      meals: ['meal'],
      neighborhoods: ['汉口', '万松园', '雪松路'],
      area: '汉口万松园 · 午餐或晚餐',
      address: '江汉区雪松路73号',
      dish: '排骨藕汤，配一份酱油炒饭或时蔬',
      routeFit: '适合住汉口、逛万松园时安排。武昌游览日先在武昌吃饭，晚间跨江另留交通时间。',
      evidence: '武汉商务2026年7月的雪松路报道具体介绍了排骨藕汤，高德门店页可核对这家总店地址。',
      sources: [
        { title: '武汉商务雪松路报道', url: 'https://sw.wuhan.gov.cn/xwdt/gzdt/202607/t20260720_2822684.shtml' },
        { title: '高德总店地址', url: 'https://www.amap.com/place/B001B0I2B4' },
      ],
      map: mapPlace('夏氏砂锅（雪松路总店）', 'B001B0I2B4'),
    },
    {
      id: 'wuhan-zhaoshifu',
      name: '家阳赵师傅油饼包烧麦（粮道街店）',
      meals: ['breakfast', 'snack'],
      neighborhoods: ['武昌', '粮道街', '司门口', '昙华林', '黄鹤楼'],
      area: '武昌粮道街 · 早餐',
      address: '武昌区粮道街139号',
      dish: '油饼包烧麦，适合趁热分着吃',
      routeFit: '可放在黄鹤楼或昙华林之前。早上排队长，就按原路线先走。',
      evidence: '武汉市政府的粮道街现场报道记录了这家店，湖北省商务厅的美食街专题也点出了这道招牌。',
      sources: [
        { title: '武汉市政府现场报道', url: 'https://www.wuhan.gov.cn/sy/whyw/202305/t20230501_2194255.shtml' },
        { title: '湖北省商务厅美食专题', url: 'https://swt.hubei.gov.cn/stdt/dtyw/202610/t20261002_6026854.shtml' },
      ],
      map: mapPlace('赵师傅油饼包烧麦', 'B001B09GR7'),
    },
    {
      id: 'wuhan-xiongtai',
      name: '熊太婆原汤水饺（粮道街店）',
      meals: ['breakfast', 'snack'],
      neighborhoods: ['武昌', '粮道街', '胭脂路', '昙华林', '司门口', '黄鹤楼'],
      area: '武昌粮道街 · 早餐或简餐',
      address: '武昌区粮道街与胭脂路交会处',
      dish: '原汤水饺，武汉这里吃的是带汤的小馄饨',
      routeFit: '逛粮道街时想坐下喝口热汤，可以选这家，再沿胭脂路走向昙华林。',
      evidence: '武汉市商务局刊载的店主访谈介绍了筒骨原汤和薄皮做法，门店食客也提到了汤里的胡椒味。',
      sources: [
        { title: '大成武昌店主访谈', url: 'https://sw.wuhan.gov.cn/xwdt/mtbd/202408/t20240802_2437123.shtml' },
        { title: '粮道街分店到店分享', url: 'https://you.ctrip.com/food/wuhan145/12884323-dianping113301925.html' },
      ],
      map: district('武昌区', '420106', '熊太婆原汤水饺（粮道街店）'),
    },
  ],
  yichang: [
    {
      id: 'yichang-shalongyan',
      name: '沙龙宴（夷陵广场店）',
      meals: ['meal'],
      neighborhoods: ['西陵', '夷陵广场', '均瑶广场', '宜昌城区'],
      area: '西陵夷陵广场 · 午餐或晚餐',
      address: '西陵区西陵一路16号，均瑶广场旁',
      dish: '宜昌肥鱼或沙龙凤爪，按人数搭配时蔬',
      routeFit: '住夷陵广场或从景区返宜昌城区后就近用餐。点鱼前先问重量、做法与价格。',
      evidence: '门店官网列有夷陵广场店地址及本土楚菜，2026年三峡日报也报道了这家分店举办的活动。',
      sources: [
        { title: '商家菜单与门店说明', url: 'https://www.shalongyan.com/faq.html' },
        { title: '三峡日报分店报道', url: 'https://epaper.cn3x.com.cn/sxrb/content/202601/30/c331152.html' },
      ],
      map: district('宜昌西陵区', '420502', '沙龙宴（夷陵广场店）'),
    },
    {
      id: 'yichang-zhengxinji',
      name: '郑信记凉虾（中山路店）',
      meals: ['snack'],
      neighborhoods: ['西陵', '老城', '致祥路', '解放路', '二马路'],
      area: '西陵老城 · 饭后小吃',
      address: '西陵区致祥路13号',
      dish: '红糖凉虾，米浆做的小吃',
      routeFit: '逛西陵老城、解放路一带时顺路喝一杯。赶船的早晨优先按码头时间走。',
      evidence: '宜昌文旅攻略点名郑信记，宜昌非遗专题采访了凉虾技艺传承人。',
      sources: [
        { title: '宜昌文旅美食攻略', url: 'https://www.yichangly.com/news/show-7407-4.html' },
        { title: '宜昌非遗专题', url: 'https://www.thepaper.cn/newsDetail_forward_9036115' },
      ],
      map: mapPlace('郑信记凉虾（中山路店）', 'B0FFFFBFXP'),
    },
  ],
  enshi: [
    {
      id: 'enshi-zhangguan',
      name: '张关合渣（航空大道店）',
      meals: ['meal'],
      neighborhoods: ['恩施城区', '航空路', '航空大道', '舞阳坝'],
      area: '恩施城区 · 午餐或晚餐',
      address: '恩施市航空大道62号，近金三角',
      dish: '肉末合渣，按同行人数配时蔬',
      routeFit: '住航空路或从山里回恩施市区时再吃。游览腾龙洞当日可以留在利川吃饭。',
      evidence: '央视网攻略列出航空大道店地址。湖北日报在宣恩采访了这门手艺的传承人，也记录了当地食客点肉末合渣。',
      sources: [
        { title: '央视网恩施攻略', url: 'https://kejiao.cntv.cn/2013/03/06/ARTI1362554541390259_7.shtml' },
        { title: '湖北日报合渣走访', url: 'https://epaper.hubeidaily.net/pc/content/202502/18/content_305331.html' },
      ],
      map: district('恩施市', '422801', '张关合渣（航空大道店）'),
    },
  ],
  xiangyang: [
    {
      id: 'xiangyang-wangfu',
      name: '王府面馆（绿影壁店）',
      meals: ['breakfast'],
      neighborhoods: ['襄城', '襄阳古城', '王府绿影壁', '绿影壁', '北街'],
      area: '襄阳古城 · 早餐',
      address: '襄城区绿影壁巷3号，近南街与民主路口',
      dish: '牛肉面或牛杂面，少辣先向店家说明',
      routeFit: '古城住宿后先吃面，再走南街、北街和汉江岸线，早上留在襄城这一侧。',
      evidence: '荆楚网2025年的襄阳旅行报道列出绿影壁巷这家店，另一篇国庆走访也点名王府绿影壁旁的门店。',
      sources: [
        { title: '荆楚网襄阳旅行报道', url: 'https://www.cnhubei.com/content/2025-03/19/content_19032284.html' },
        { title: '2025年国庆门店走访', url: 'https://m.cnhubei.com/content/2025-09/30/content_19544917.html' },
      ],
      map: district('襄城区', '420602', '王府面馆 绿影壁'),
    },
  ],
};

export function findFoodShops(cityId: string, query = '', meal?: FoodMeal): readonly LocalFoodShop[] {
  const shops = localFoodShops[cityId] || [];
  const named = shops.filter(shop => query.includes(shop.name.split('（')[0].replace(/^家阳/, '')));
  if (named.length) return meal ? named.filter(shop => shop.meals.includes(meal)) : named;
  const inArea = shops.filter(shop => shop.neighborhoods.some(area => query.includes(area)));
  const candidates = inArea.length ? inArea : shops;
  return meal ? candidates.filter(shop => shop.meals.includes(meal)) : candidates;
}
