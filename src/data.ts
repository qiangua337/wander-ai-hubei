export { cities, cityById } from './data/cities';
export { destinations, featuredDestinations, destinationById } from './data/destinations';
export { imageCredits, cityPhotos } from './data/photos';
export type { CityGuide, Destination, TripDay, PhotoCredit } from './data/types';
export const stories = [
  { name: '小林', theme: '恩施 · 山水徒步', initial: '林', color: 'bg-[#e8e9db] text-[#66743e]', title: '把时间留给沿途的风景', quote: '“不用再在十几个页面之间来回切换。把想去的地方放在一起，出发这件事也变得轻盈了。”' },
  { name: '阿然', theme: '神农架 · 自然慢游', initial: '然', color: 'bg-[#dce9e3] text-[#477363]', title: '找到属于自己的旅行节奏', quote: '“我们想去森林里慢慢走，而不是赶着打卡。能按自己的喜好整理行程，这才是理想中的假期。”' },
  { name: '晓晓', theme: '武汉 · 城市漫游', initial: '晓', color: 'bg-[#f4e3dc] text-[#a66f59]', title: '一次轻松的周末出走', quote: '“登黄鹤楼、逛老街、到江边吹吹风。一个周末也可以装下很多美好的瞬间。”' },
];
