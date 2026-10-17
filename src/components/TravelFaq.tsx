export function TravelFaq() {
  const questions = [
    { q: '第一次来湖北，先选一座城还是跨城？', a: '两三天优先选一座城市。武汉适合城市文化与过早，宜昌适合峡江与工程，恩施适合山地与土家文化。有五到七天再串联；跨城日的上午留给退房、车站与交通，不照搬完整景点日。' },
    { q: '推荐的是酒店还是住宿片区？能直接预订吗？', a: '推荐到具体片区，并说明适合人群、行程关系与订前检查项。地图链接用于查找当地住宿；房价、空房、早餐、停车与取消政策须向酒店或预订平台核对，本站不生成真实订单。' },
    { q: '不自驾能去山区吗？', a: '可以先高铁到集散城市，再提前落实正规旅游直通车或包车。山区景点分散，景区内部换乘与城市间交通要分别确认，不默认出景区时随时能叫到网约车。' },
    { q: '带孩子或长辈，怎样把行程放慢？', a: '规划时选择同行人群与轻松慢游，下午原活动会成为可选内容，保留必要交通。山地的索道不代表全程无台阶；推车与无障碍通行需逐个景区确认。参观大型博物馆可只选一个主题深入看。' },
    { q: '行程可以保存、分享和离线看吗？', a: '在规划结果中保存到当前浏览器，最多保留五份；复制分享链接可在另一台设备恢复相同设置，链接不包含自由备注。下载文本清单可离线阅读；本站未接入实时 AI，组合结果来自编辑路线和你的选择。' },
  ];
  return <section id="faq" aria-labelledby="faq-title" className="page-width section-space grid gap-10 lg:grid-cols-[.8fr_1.2fr]"><div><p className="eyebrow">BEFORE YOU GO</p><h2 id="faq-title" className="section-title">出发前，<br />你可能还想知道。</h2><p className="mt-5 max-w-sm text-sm leading-8 text-muted">少一点临时纠结，多一点从容。<br />把实际问题放在出发之前。</p></div><div className="divide-y divide-line border-y border-line">{questions.map(item => <details className="group py-5" key={item.q}><summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-sm font-medium leading-7">{item.q}<span className="font-display text-xl font-light text-pine transition group-open:rotate-45">+</span></summary><p className="mt-4 pr-5 text-[13px] leading-8 text-muted">{item.a}</p></details>)}</div></section>;
}
