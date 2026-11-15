import type { TravelLeg } from './day-journeys';
import { returnWalks, type ReturnSource } from './return-mornings';

export type VisitOption = {
  id?: string;
  cityId: string;
  title: string;
  duration: number;
  detail: string;
  dinner?: string;
  base: RegExp;
  preferredFor?: RegExp;
  inbound?: TravelLeg;
  outbound?: TravelLeg;
  fromStops?: Readonly<Record<string, TravelLeg>>;
  close: number;
  ticketed?: boolean;
  sources: ReturnSource[];
};

const eastLake: ReturnSource = { title: '东湖风景区 · 漫游地图与听涛入口', url: 'https://www.whdonghu.gov.cn/ztzl_6323/wlzl/202601/t20260122_2716447.shtml' };
const lakeTransit: ReturnSource = { title: '武汉市公安局 · 梨园与省博的出行指引', url: 'https://gaj.wuhan.gov.cn/jmzx/jfts/202504/t20250430_2576018.html' };
const wuchangWalk: ReturnSource = { title: '武昌区政府 · 中华路城市阳台', url: 'https://www.wuchang.gov.cn/zjwc/wcly/xing/mt/202005/t20200507_1241452.html' };
const oldTown: ReturnSource = { title: '武汉市政府 · 武昌老城与斗级营', url: 'https://3g.wuhan.gov.cn/sy/whyw/202507/t20250711_2618443.shtml' };
const yichangStreet: ReturnSource = { title: '宜昌市住建局 · 二马路历史文化街区', url: 'https://zj.yichang.gov.cn/content-41740-985503-1.html' };
const yichangRiver: ReturnSource = { title: '宜昌市园林绿化建设管护中心 · 镇江阁与滨江绿道', url: 'https://ylj.yichang.gov.cn/content-43955-959687-1.html' };
const qingjiang: ReturnSource = { title: '湖北省住建厅 · 恩施清江亲水走廊', url: 'https://zjt.hubei.gov.cn/bmdt/dtyw/szsm/202605/t20260508_5929789.shtml' };
const wuchang = /^(?:武昌\s*·|武昌老城|司门口|昙华林)/;
const toLake: TravelLeg = {
  method: '到司门口黄鹤楼站乘 5 号线，在徐家棚换 8 号线到梨园站，再步行至听涛入口。',
  minutes: [40, 55],
  drive: { method: '自驾至梨园片区可用停车点，再步行至听涛入口。', minutes: [30, 50] },
};
const backFromLake: TravelLeg = {
  method: '从梨园站乘 8 号线，在徐家棚换 5 号线回司门口一带，再步行回住处。',
  minutes: [40, 55],
  drive: { method: '步行取车，从梨园片区回司门口—昙华林的住宿点。', minutes: [30, 50] },
};
const riverside: TravelLeg = { method: '从司门口经武昌老城街巷步行到临江大道一侧。', minutes: [15, 25] };
const returnRiverside: TravelLeg = { method: '走临江大道与武昌老城街巷回住处或寄存点。', minutes: [15, 25] };

// A move uses an edited short visit of the original stop and a verified connection
// from the receiving day's lodging or last attraction. Times are planning allowances.
export const moveVisits: Readonly<Record<string, VisitOption>> = {
  'wuhan:0:main': {
    cityId: 'wuhan', title: '黄鹤楼', duration: 75, base: wuchang, close: 15 * 60 + 45, ticketed: true,
    detail: '只看主楼与长江大桥方向，按已确认的入园口、闭园时间和台阶条件安排。',
    inbound: { method: '从司门口或昙华林沿武昌老城步行到当天开放的入口。', minutes: [20, 35] },
    outbound: { method: '从可通行的老城方向出口沿街步行回住处。', minutes: [20, 35] },
    sources: [oldTown],
  },
  'wuhan:0:afternoon': {
    cityId: 'wuhan', title: '中华路江边', duration: 35, base: wuchang, close: 17 * 60,
    inbound: riverside, outbound: returnRiverside, sources: [wuchangWalk],
    detail: '沿中华路城市阳台看江和长江大桥，走一小段后原路回到街区，遇封闭就缩短。',
  },
  'wuhan:1:afternoon': {
    cityId: 'wuhan', title: '东湖听涛 · 梨园', duration: 45, base: wuchang, close: 16 * 60 + 30,
    detail: '从梨园入口只走一段听涛湖岸，沿原线返回，不加船游或远端绿道。',
    inbound: toLake, outbound: backFromLake, sources: [eastLake, lakeTransit],
    fromStops: {
      '中华路江边': {
        ...toLake,
        method: '从中华路江边步行至司门口黄鹤楼站，乘 5 号线到徐家棚换 8 号线，梨园站下车。',
        minutes: [45, 60],
      },
    },
  },
  'yichang:0:afternoon': {
    cityId: 'yichang', title: '镇江阁附近滨江步道', duration: 35, base: /西陵|二马路|解放路|夷陵广场/, close: 17 * 60 + 15,
    inbound: { method: '从西陵城区步行或乘短途公交到镇江阁附近的滨江步道入口。', minutes: [15, 30] },
    outbound: { method: '沿原路离开滨江步道，步行或短程接驳回西陵住宿处。', minutes: [15, 30] },
    detail: '沿开通的一段江岸看镇江阁外观和长江，遇高水位或步道封闭就折返。', sources: [yichangRiver],
  },
  'jingzhou:0:afternoon': {
    cityId: 'jingzhou', title: '古城东门 · 宾阳楼与护城河', duration: 30, base: /^(?:荆州古城|东门护城河)/, close: 17 * 60 + 20,
    inbound: { method: '从古城住处步行或乘短途车到东门，选择紧邻护城河的地面入口。', minutes: [15, 30] },
    outbound: { method: '沿护城河折回东门，再步行或乘短途车回原落脚处。', minutes: [15, 30] },
    detail: '看宾阳楼外观与一段护城河，入楼或登墙另留整段时间。', sources: returnWalks.jingzhou![0].sources,
  },
  'huangshi:0:afternoon': {
    cityId: 'huangshi', title: '磁湖岸线', duration: 30, base: /磁湖|黄石城区/, close: 17 * 60 + 20,
    inbound: { method: '从磁湖住宿一侧选择最近的开放湖岸入口，步行或短途接驳。', minutes: [10, 20] },
    outbound: { method: '走原入口回住宿或寄存点。', minutes: [10, 20] },
    detail: '走一小段磁湖公共岸线，保留原路折返的时间。', sources: returnWalks.huangshi![0].sources,
  },
  'xiangyang:0:afternoon': {
    cityId: 'xiangyang', title: '临汉门与城墙开放段', duration: 35, base: /^(?:襄城|古城)/, close: 17 * 60 + 30,
    inbound: { method: '从襄城古城住宿处沿北街步行到临汉门一带。', minutes: [10, 25] },
    outbound: { method: '沿北街步行回古城住处或寄存点。', minutes: [10, 25] },
    detail: '先看临汉门和城墙外观，按当日开放范围走一小段。需要登墙时先核对台阶。', sources: returnWalks.xiangyang![0].sources,
  },
};

export const shortWalks: VisitOption[] = [
  {
    id: 'doujiying', cityId: 'wuhan', title: '斗级营老街', duration: 30, base: wuchang, close: 17 * 60 + 45,
    preferredFor: /黄鹤楼|博物馆|老街|城墙/,
    inbound: { method: '在司门口一侧沿街步行到斗级营，选容易折返的街口进入。', minutes: [10, 15] },
    outbound: { method: '从同一街口步行回司门口—昙华林住宿或寄存片区。', minutes: [10, 15] },
    fromStops: {
      '黄鹤楼': { method: '从黄鹤楼靠老城一侧的开放出口，沿司门口街巷步行去斗级营。', minutes: [10, 20] },
      '湖北省博物馆': {
        method: '从省博湖北日报站乘 8 号线，在徐家棚换 5 号线到司门口黄鹤楼站，再步行去斗级营。',
        minutes: [45, 60],
        drive: { method: '从省博片区自驾到司门口可用停车点，再步行进斗级营。', minutes: [40, 60] },
      },
    },
    detail: '看老街巷与改造后的沿街建筑，选主街一段，随时可以折返。', sources: [oldTown],
  },
  {
    id: 'zhonghualu-balcony', cityId: 'wuhan', title: '中华路城市阳台', duration: 30, base: wuchang, close: 17 * 60 + 30,
    preferredFor: /东湖|江边|山水/,
    inbound: riverside, outbound: returnRiverside, detail: '走到临江的公共观景处，看长江大桥，留在武昌岸。', sources: [wuchangWalk],
  },
  {
    id: 'erma-post-lane', cityId: 'yichang', title: '二马路邮政巷', duration: 25, base: /西陵|二马路|解放路|夷陵广场/, close: 17 * 60 + 30,
    detail: '沿二马路和邮政巷看开埠街区的老建筑，晚餐留在解放路或住宿附近。', sources: [yichangStreet],
  },
  {
    id: 'qingjiang-street', cityId: 'enshi', title: '舞阳坝清江里街', duration: 25, base: /^(?:恩施城区|舞阳坝)/, close: 17 * 60 + 30,
    detail: '在清江里街看梧桐和沿街民居，选靠住处的一段走。', dinner: '晚餐留在舞阳坝，合渣和炕洋芋配一荤一素。', sources: [qingjiang],
  },
];

export function walksForCity(cityId: string): VisitOption[] {
  const known = returnWalks[cityId]?.map(walk => ({
    id: walk.id, cityId, title: walk.sight, duration: walk.minutes, detail: walk.detail, base: walk.base, close: 17 * 60 + 30, sources: walk.sources,
  })) || [];
  return [...known, ...shortWalks.filter(walk => walk.cityId === cityId)];
}
