export function initPickTime(){
  const startOfDay = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = startOfDay(new Date());
  return [
    new Date(today.setDate(today.getDate() - 6)), // 前6天
    new Date(today.setDate(today.getDate() + 7))  // 明天（today已变为前6天，+7=明天）
  ];
}
export function formatTs(v){
  const year = v.getFullYear();
  const month = (v.getMonth() + 1).toString().padStart(2, '0'); // 月份是从0开始的
  const day = v.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}T00:00:00+${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}