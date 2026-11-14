export type ReturnSource = { title: string; url: string };

export type ReturnWalk = {
  id: string;
  base: RegExp;
  area: string;
  sight: string;
  detail: string;
  breakfast: string;
  lunch: string;
  minutes: number;
  stationBuffers: Record<string, number>;
  sources: ReturnSource[];
};

export const railwayEntrySource: ReturnSource = {
  title: '铁路 12306 · 进出站与候车', url: 'https://kyfw.12306.cn/otn/gonggao/enterAndExit.html',
};

// These are short outdoor visits in the overnight area. Station buffers are planning allowances,
// including local waiting and transfers, rather than measured journey times.
export const returnWalks: Partial<Record<string, ReturnWalk[]>> = {
  wuhan: [
    {
      id: 'wuchang-old-town', base: /^(?:武昌(?!或)|司门口|昙华林)/, area: '武昌老城 · 昙华林—粮道街', sight: '昙华林主街短逛',
      detail: '选靠粮道街的一段主街，看沿街老建筑。走累了随时折返，不绕进山坡支巷。',
      breakfast: '在粮道街挑一家不用久排的早点铺，热干面或三鲜豆皮二选一。',
      lunch: '留得出午餐时间，就在粮道街或酒店附近吃一碗鱼糊汤粉，或选湖北家常简餐。',
      minutes: 35, stationBuffers: { 武昌站: 45, 武汉站: 80, 武汉东站: 80 },
      sources: [
        { title: '武汉市政府 · 粮道街、昙华林与武汉过早', url: 'https://www.wuhan.gov.cn/ztzl/25zt/whgzwh/index.shtml' },
        { title: '武汉市政府 · 武汉铁路客站分布', url: 'https://www.wuhan.gov.cn/sy/whyw/202605/t20260531_2771214.shtml' },
      ],
    },
    {
      id: 'jianghan-road', base: /^汉口(?!或)/, area: '汉口 · 江汉路周边', sight: '江汉路看老建筑',
      detail: '只走住处附近一段步行街，看看老建筑立面，沿原路返回取行李。',
      breakfast: '在江汉路附近吃热干面或糊汤粉，遇长队就换一家。',
      lunch: '同片区吃家常湖北菜或简餐，有充足时间再坐下来吃。',
      minutes: 35, stationBuffers: { 汉口站: 55 },
      sources: [{ title: '武汉市政府 · 江汉路步行街与武汉风味', url: 'https://www.wuhan.gov.cn/sy/tswh/202511/t20251116_2678456.shtml' }],
    },
  ],
  yichang: [{
    id: 'yichang-erma-road', base: /^(?:宜昌西陵|宜昌城区|西陵|夷陵广场)/, area: '宜昌西陵 · 二马路周边', sight: '二马路历史街区短逛',
    detail: '就近走一段二马路，看看街区里的开埠建筑。留在西陵城区，随时能折回住宿点。',
    breakfast: '在二马路至解放路片区找早饭，可选红油小面或包子。',
    lunch: '在同片区吃简餐，萝卜饺子和凉虾可作小吃和甜点。',
    minutes: 35, stationBuffers: { 宜昌东站: 65, 宜昌北站: 90 },
    sources: [
      { title: '宜昌市商务局 · 二马路、解放路与宜昌风味', url: 'https://swj.yichang.gov.cn/content-42665-976065-1.html' },
      { title: '宜昌市政府 · 宜昌东站与城区交通', url: 'https://www.yichang.gov.cn/html/zhengwuyizhantong/zhengwuzixun/jinriyaowen/2024/0129/1058125.html' },
    ],
  }],
  enshi: [{
    id: 'enshi-qingjiang', base: /^(?:恩施城区|舞阳坝)/, area: '恩施城区 · 舞阳坝清江沿岸', sight: '清江亲水走廊走一段',
    detail: '选舞阳坝住宿点附近的已开放步道，看一段清江，按原路折返。雨后或遇封闭，换成街区早餐。',
    breakfast: '在舞阳坝住宿周边吃一碗恩施豆皮或米面，不专程跑市场。',
    lunch: '附近找家常简餐，合渣或炕洋芋搭配主食，来不及就到站后补给。',
    minutes: 35, stationBuffers: { 恩施站: 60 },
    sources: [{ title: '湖北省住建厅 · 舞阳坝与清江亲水走廊', url: 'https://zjt.hubei.gov.cn/bmdt/dtyw/szsm/202605/t20260508_5929789.shtml' }],
  }],
  xiangyang: [{
    id: 'xiangyang-north-street', base: /^(?:襄城(?!或)|古城)/, area: '襄城 · 北街—临汉门', sight: '襄阳北街与临汉门外观',
    detail: '从北街就近走到临汉门一带，只看街巷和城门外观，时间到就折返。',
    breakfast: '在北街附近吃一碗襄阳牛肉面或豆腐面，怕辣可先问店家。',
    lunch: '还在北街且时间宽裕，可就近吃简餐，红糖饼适合少量分食。',
    minutes: 35, stationBuffers: { 襄阳站: 70, 襄阳东站: 85 },
    sources: [{ title: '湖北文旅厅 · 襄阳北街、临汉门与牛肉面', url: 'https://wlt.hubei.gov.cn/bmdt/mtjj/202609/t20260915_6013645.shtml' }],
  }],
  jingzhou: [{
    id: 'jingzhou-east-gate', base: /^荆州古城/, area: '荆州古城 · 东门护城河', sight: '荆州古城东门看宾阳楼外观',
    detail: '住在东门接驳片区时，沿护城河走一小段，看城墙与宾阳楼外观。住在别的城门附近就选当地一段。',
    breakfast: '在住宿附近吃早堂面，优先选出餐快的早餐铺。',
    lunch: '行李和接驳时间都确认后，可在古城周边吃荆州鱼糕配时蔬与米饭。',
    minutes: 35, stationBuffers: { 荆州站: 55 },
    sources: [
      { title: '湖北文旅厅 · 荆州古城宾阳楼与护城河', url: 'https://wlt.hubei.gov.cn/bmdt/xydt/201911/t20191121_1370666.shtml' },
      { title: '湖北文旅厅 · 荆州鱼糕', url: 'https://wlt.hubei.gov.cn/bmdt/ztzl/zshb/201912/t20191226_1799370.shtml' },
    ],
  }],
  huangshi: [{
    id: 'huangshi-cihu', base: /^(?:黄石磁湖|黄石城区)/, area: '黄石城区 · 磁湖', sight: '磁湖开放湖岸短走',
    detail: '选离住宿最近的一段开放湖岸步道，按原路折返。当天无需绕湖或再去矿山景区。',
    breakfast: '在住宿附近吃本地米面，黄石港饼可以带作路上点心。',
    lunch: '时间宽裕时就近吃湖区家常菜配米饭。',
    minutes: 30, stationBuffers: { 黄石北站: 65 },
    sources: [{ title: '黄石市体育事业发展中心 · 磁湖湖岸步道', url: 'https://tysyfzzx.huangshi.gov.cn/tycy/202306/t20230616_1023546.html' }],
  }],
  tianmen: [{
    id: 'tianmen-luyu', base: /^天门城区/, area: '天门城区 · 陆羽故园周边', sight: '陆羽故园附近走一段西湖岸线',
    detail: '住在西湖附近时，可从附近已开放的步道走一小段，看水边园林，随时回住宿点取行李。',
    breakfast: '在陆羽文化片区吃碗本地米面，茶点适合作小吃。',
    lunch: '车站接驳已确认且时间宽裕时，可就近尝天门三蒸配米饭。',
    minutes: 30, stationBuffers: { 天门站: 85, 天门南站: 100 },
    sources: [{ title: '天门市政府 · 陆羽故园与西湖岸线', url: 'https://www.tianmen.gov.cn/hdjl/xwfbh/201606/t20160618_2006803.shtml' }],
  }],
};
