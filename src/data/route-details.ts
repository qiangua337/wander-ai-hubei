export type RouteEffort = 'low' | 'moderate' | 'high';
export type RouteDetail = {
  region: string; effort: RouteEffort; stayAreaIndex: number; foodAreaIndex: number;
  breakfast?: string; lunch?: string; dinner?: string; foodEvening?: string;
};
const route = (region: string, effort: RouteEffort, stayAreaIndex = 0, foodAreaIndex = 0, meals: Partial<RouteDetail> = {}): RouteDetail => ({ region, effort, stayAreaIndex, foodAreaIndex, ...meals });

// Editorial area and effort labels derived from each existing chapter, not accessibility guarantees.
// Meal areas and dishes reuse the site's practical guide; no restaurant, opening or price is invented.
export const routeDetails: Record<string, RouteDetail[]> = {
  wuhan: [
    route('武昌老城', 'moderate', 0, 0, { breakfast: '武昌老城街巷：热干面与豆皮，放在登楼前，分食留出午餐食量。', lunch: '武昌老城片区：就近选择正常午餐，先看菜单和排队，不为找店跨江。', dinner: '武昌住宿片区：排骨藕汤配时蔬与主食，饭后再去江岸。', foodEvening: '武昌街巷晚餐与江岸散步' }),
    route('武昌 · 省博与东湖', 'low', 0, 0, { breakfast: '武昌住宿片区：出门前吃早餐；酒店供餐时间先确认。', lunch: '省博—东湖片区：参观间隙安排简餐，具体供餐点和排队到访前确认。', dinner: '武昌住宿片区：藕汤搭配家常湖北菜，今晚不再赶另一处大型景点。', foodEvening: '武昌家常晚餐与休息' }),
    route('汉口—汉阳', 'moderate', 1, 1, { breakfast: '汉口江汉路周边或住宿片区：糊汤粉等米面早餐，先核对供餐时段。', lunch: '汉口或汉阳当天所在片区：按跨江顺序就近吃正餐，不反复跨江找店。', dinner: '汉口街巷：本地家常菜配主食与蔬菜，吃完再去江滩，返程者先核对取行李时间。', foodEvening: '汉口地方晚餐，再走江滩' }),
  ],
  yichang: [
    route('宜昌西陵城区', 'low', 0, 0, { breakfast: '西陵住宿片区：早餐后再去博物馆；酒店供餐时间先确认。', lunch: '宜昌城区：安排正常午餐；凉虾、萝卜饺子作为小吃或甜点，不能代替正餐。', dinner: '二马路—红星路或住宿片区：家常湖北菜，街区小吃按食量分食。', foodEvening: '城区正餐与二马路街区小吃' }),
    route('三峡坝区—秭归', 'moderate', 0, 1, { breakfast: '宜昌住宿片区：出发前吃早饭，集合地点与时间提前确认。', lunch: '坝区—秭归顺路正规餐馆：先落实供餐，再安排两个景点之间的休息。', dinner: '当晚宜昌或秭归住宿片区：炕土豆、合渣配家常正餐；先确认菜量。' }),
    route('三斗坪 · 三峡人家', 'moderate', 0, 1, { breakfast: '住宿片区：早餐后前往已确认的码头或集合点，不为小吃耽误船班。', lunch: '三峡人家游览片区：景区正规供餐或自备便携补给，具体供餐与线路先确认。', dinner: '返宜昌后在住宿片区吃家常正餐，晚间只安排餐食与休息。', foodEvening: '返城后吃正餐与休整' }),
    route('长阳 · 清江', 'moderate', 1, 1, { breakfast: '当晚住宿片区：早饭与出发车辆、船班衔接先落实。', lunch: '清江游览途中：按所购航线确认供餐，自带适量补给。', dinner: '长阳或宜昌实际返程片区：合渣、炕土豆配家常饭菜，不跨方向专程找餐馆。' }),
  ],
  enshi: [
    route('恩施城区', 'low', 0, 0, { breakfast: '恩施城区住宿附近：先吃早餐，具体供餐点和时段待确认。', lunch: '恩施城区家常餐馆：合渣配一荤一素，先问分量和辣度。', dinner: '恩施城区：炕洋芋搭配正常饭菜；餐后可品恩施玉露，女儿城按精力选择。', foodEvening: '恩施城区土家家常晚餐' }),
    route('恩施大峡谷', 'high', 0, 0, { breakfast: '恩施城区：景区接驳出发前吃早饭，并准备饮水和便携补给。', lunch: '七星寨等所选游览片区：便携补给或已确认的景区正规餐食，不以两片区都走完为前提。', dinner: '返恩施城区后：腊肉与蔬菜配主食，长时间步行后早点休息。', foodEvening: '恩施城区晚餐与休整' }),
    route('利川 · 腾龙洞', 'moderate', 1, 1, { breakfast: '当前住宿片区：前往利川前吃早餐，车站和景区接驳另留时间。', lunch: '利川城区或腾龙洞已确认供餐处：正常午餐，不紧贴演出入场时刻用餐。', dinner: '利川城区：山地家常菜、腊肉配蔬菜；若当天返恩施，先安排返程再确定用餐地点。', foodEvening: '利川地方晚餐与返程整备' }),
    route('恩施或利川返程片区', 'low', 0, 0, { breakfast: '实际住宿片区：早餐后再取行李，酒店供餐时间先确认。', lunch: '实际返程车站所在城区：选方便衔接交通的正餐，不再跑远山找店。', dinner: '返程日不固定安排目的地晚餐；按到站时间和实际路线另行确认。' }),
  ],
  shiyan: [route('武当山山门与宫观', 'moderate'), route('武当山金顶—南岩', 'high'), route('丹江口城区与库区', 'low', 1, 1)],
  xiangyang: [route('襄城古城', 'moderate'), route('古隆中', 'moderate'), route('樊城—襄城', 'moderate', 1, 1)],
  jingzhou: [route('荆州古城', 'moderate'), route('纪南 · 楚王车马阵', 'moderate'), route('松滋 · 洈水', 'moderate', 1, 1)],
  jingmen: [route('钟祥城区与明显陵', 'moderate'), route('荆门城区与漳河', 'low', 1, 1), route('京山 · 绿林山', 'high', 1, 1)],
  huangshi: [route('大冶—黄石城区', 'moderate'), route('铁山 · 矿山公园', 'moderate'), route('阳新 · 王英镇', 'moderate', 1, 1)],
  ezhou: [route('鄂州城区与西山', 'moderate'), route('梁子湖旅游片区', 'low', 1, 1)],
  huanggang: [route('黄州城区', 'low'), route('麻城 · 龟峰山', 'high', 1, 1), route('已选山地住宿与返程片区', 'low', 1, 1)],
  xianning: [route('赤壁古战场', 'moderate', 1, 1), route('赤壁 · 羊楼洞', 'low', 1, 1), route('咸宁温泉城区', 'low')],
  xiaogan: [route('孝感城区', 'low'), route('云梦城区', 'low', 1, 1), route('双峰山森林线', 'high', 1, 1)],
  suizhou: [route('随州城区', 'low'), route('炎帝故里', 'moderate'), route('洛阳镇银杏谷', 'low', 1, 1)],
  xiantao: [route('梦里水乡', 'low', 1, 1), route('沔阳小镇片区', 'low')],
  qianjiang: [route('潜江城区', 'low'), route('龙湾遗址片区', 'moderate')],
  tianmen: [route('石家河遗址片区', 'moderate'), route('天门城区', 'low')],
  shennongjia: [route('木鱼镇与官门山', 'moderate'), route('神农顶开放片区', 'high'), route('大九湖与坪阡', 'low', 1, 1), route('天燕与返程接驳', 'moderate')],
};
