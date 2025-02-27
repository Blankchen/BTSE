// 計算累計總量
export const calculateTotals = (quotes) => {
  let total = 0;
  return quotes.map((quote) => {
    total += parseFloat(quote.size);
    return {
      ...quote,
      total,
    };
  });
};

// Buy quotes: sum up quote size from highest price quote to the lowest
export const handleSnapshotBids = (bids) => {
  const sortedBids = bids
    .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // 價格降序排序
    .slice(0, 8)
    .map(([price, size]) => ({ price, size }));

  return calculateTotals(sortedBids);
};

// Sell quotes: sum up quote size from lowest price quote to the highest
export const handleSnapshotAsks = (asks) => {
  const sortedAsks = asks
    .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])) // 價格升序排序
    .slice(0, 8)
    .map(([price, size]) => ({ price, size }));

  return calculateTotals(sortedAsks);
};

const deepClone = (value) => JSON.parse(JSON.stringify(value));

export const handleDeltaOrder = (
  prevOrders = [],
  apiOrders,
  newQuotesTemp = {},
  changedSizesTemp = {},
  sortFn = (a, b) => parseFloat(b.price) - parseFloat(a.price)
) => {
  // 深拷貝之前的訂單
  const newOrders = deepClone(prevOrders);

  // 處理訂單更新
  apiOrders.forEach(([price, size]) => {
    const priceFloat = parseFloat(price);
    const index = newOrders.findIndex(
      (bid) => parseFloat(bid.price) === priceFloat
    );

    if (parseFloat(size) === 0) {
      // 移除數量為0的訂單
      if (index !== -1) {
        newOrders.splice(index, 1);
      }
    } else {
      if (index !== -1) {
        // 比較新舊大小，標記變化
        const oldSize = parseFloat(newOrders[index].size);
        const newSize = parseFloat(size);
        if (oldSize !== newSize) {
          changedSizesTemp[price] = newSize > oldSize ? "increase" : "decrease";
        }
        newOrders[index].size = size;
      } else {
        // 新的報價
        newOrders.push({ price, size });
        newQuotesTemp[price] = true;
      }
    }
  });

  // 重新排序並限制數量
  const sortedBids = newOrders.sort(sortFn).slice(0, 8);

  return calculateTotals(sortedBids);
};
