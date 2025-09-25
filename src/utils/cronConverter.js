/**
 * Cron表达式转换工具
 * 支持中文描述与cron表达式的双向转换
 */

/**
 * 将中文描述转换为cron表达式
 * @param {string} description - 中文描述，如 "10 秒", "5 分", "2 时", "3 天"
 * @returns {string} - cron表达式
 */
export function descriptionToCron(description) {
  if (!description || typeof description !== 'string') {
    return '';
  }

  const desc = description.trim();

  // 处理简洁格式：xx 秒
  const secondMatch = desc.match(/^(\d+)\s*秒$/);
  if (secondMatch) {
    const seconds = parseInt(secondMatch[1]);
    if (seconds > 0 && seconds <= 59) {
      return `0/${seconds} * * * * ?`;
    }
  }

  // 处理简洁格式：xx 分
  const minuteMatch = desc.match(/^(\d+)\s*分$/);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1]);
    if (minutes > 0 && minutes <= 59) {
      return `0 */${minutes} * * * ?`;
    }
  }

  // 处理简洁格式：xx 时
  const hourMatch = desc.match(/^(\d+)\s*时$/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1]);
    if (hours > 0 && hours <= 23) {
      return `0 0 */${hours} * * ?`;
    }
  }

  // 处理简洁格式：xx 天
  const dayMatch = desc.match(/^(\d+)\s*天$/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    if (days > 0 && days <= 31) {
      return `0 0 0 */${days} * ?`;
    }
  }

  // 处理每周
  const weekMatch = desc.match(/每周([一二三四五六日天])/);
  if (weekMatch) {
    const weekDay = weekMatch[1];
    const weekMap = {
      '一': 'MON',
      '二': 'TUE',
      '三': 'WED',
      '四': 'THU',
      '五': 'FRI',
      '六': 'SAT',
      '日': 'SUN',
      '天': 'SUN'
    };
    const weekCode = weekMap[weekDay];
    if (weekCode) {
      return `0 0 0 ? * ${weekCode}`;
    }
  }
  // 默认情况
  console.warn('无法识别的描述格式:', description);
  return '';
}

/**
 * 将cron表达式反向转为中文描述
 * @param {string} cron - cron表达式
 * @returns {string} - 中文描述，如"10 秒"、"5 分"等，无法识别时返回原始cron
 */
export function cronToDescription(cron) {
  if (!cron || typeof cron !== 'string') {
    return '';
  }
  const trimCron = cron.trim();

  // 秒
  let match = trimCron.match(/^0\/(\d+) \* \* \* \* \?$/);
  if (match) {
    return `${parseInt(match[1])} 秒`;
  }
  // 分
  match = trimCron.match(/^0 \*\/(\d+) \* \* \* \?$/);
  if (match) {
    return `${parseInt(match[1])} 分`;
  }
  // 时
  match = trimCron.match(/^0 0 \*\/(\d+) \* \* \?$/);
  if (match) {
    return `${parseInt(match[1])} 时`;
  }
  // 天
  match = trimCron.match(/^0 0 0 \*\/(\d+) \* \?$/);
  if (match) {
    return `${parseInt(match[1])} 天`;
  }
  // 每周
  match = trimCron.match(/^0 0 0 \? \* (MON|TUE|WED|THU|FRI|SAT|SUN)$/);
  if (match) {
    const weekMap = {
      'MON': '一',
      'TUE': '二',
      'WED': '三',
      'THU': '四',
      'FRI': '五',
      'SAT': '六',
      'SUN': '日'
    };
    return `每周${weekMap[match[1]] || match[1]}`;
  }
  // 其他情况
  return trimCron;
}

/**
 * 快速转换：中文描述转cron表达式
 * @param {string} description - 中文描述
 * @returns {string} - cron表达式
 */
export function quickConvert(description) {
  return descriptionToCron(description);
}
