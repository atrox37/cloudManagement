/**
 * 轮询周期选项（统一配置）
 * value 使用 cron 表达式，label 为用户可读描述
 */
export const pollIntervalOptions = [
  { value: '0/5 * * * * ?',  label: '5 秒',   seconds: 5   },
  { value: '0/10 * * * * ?', label: '10 秒',  seconds: 10  },
  { value: '0/15 * * * * ?', label: '15 秒',  seconds: 15  },
  { value: '0/20 * * * * ?', label: '20 秒',  seconds: 20  },
  { value: '0/30 * * * * ?', label: '30 秒',  seconds: 30  },
  { value: '0 */1 * * * ?',  label: '60 秒',  seconds: 60  },
  { value: '0 */2 * * * ?',  label: '120 秒', seconds: 120 },
];

/**
 * 根据 cron 表达式查找对应的秒数
 * @param {string} cronExpr - cron 表达式
 * @returns {number} - 对应的秒数，无法匹配时返回 0
 */
export function cronToSeconds(cronExpr) {
  const option = pollIntervalOptions.find(o => o.value === cronExpr);
  return option ? option.seconds : 0;
}
