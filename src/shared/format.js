// 格式化數字，添加千位分隔符
export const formatNumber = (num, decimals = 2) => {
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};