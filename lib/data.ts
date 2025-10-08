export const buttonDatas = [
  { text: '黑客入口', path: '/dashboard' },
  { text: '評審入口', path: '/judge' },
  { text: '贊助商入口', path: '/sponsor' },
];

export const navItems = [
  { text: '首頁', path: '/' },
  { text: '活動日程', path: '/#schedule' },
  { text: '參賽須知', path: '/#guidelines' },
  { text: '活動獎項', path: '/#prize' },
  { text: '競賽題目', path: '/#challenges' },
//  { text: '儀表板', path: '/dashboard' },
//  { text: '時程表', path: '/schedule' },
//  { text: '黑客包', path: '/hackerpacks' },
];

export const stats = [
  {
    data: 'Big',
    object: 'statistic 1',
  },
  {
    data: 'Shocking',
    object: 'statistic 2',
  },
  {
    data: 'Incredible',
    object: 'statistic 3',
  },
];

export const DEFAULT_EVENT_FORM_DATA: ScheduleEvent = {
  description: '',
  title: '',
  page: '',
  type: '',
  track: '',
  location: '',
  speakers: [],
  startDate: new Date(),
  endDate: new Date(),
  Event: -1,
};
