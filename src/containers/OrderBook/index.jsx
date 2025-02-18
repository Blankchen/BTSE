import React, { useState, useEffect, useRef } from "react";
import "./index.scss";
import {
  connectOrderBookSocket,
  connectLastPriceSocket,
} from "../../api/socket";
import { OrderTable } from "../../components/OrderTable";
import { LastPrice } from "../../components/LastPrice";

// 格式化數字，添加千位分隔符
const formatNumber = (num, decimals = 2) => {
  return Number(num).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const OrderBook = () => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [lastPrice, setLastPrice] = useState(null);
  const [prevLastPrice, setPrevLastPrice] = useState(null);
  const [newQuotes, setNewQuotes] = useState({ bids: {}, asks: {} });
  const [changedSizes, setChangedSizes] = useState({ bids: {}, asks: {} });
  const lastPricesSocketRef = useRef(null);
  const orderBookSocketRef = useRef(null);

  // 計算累計總量
  const calculateTotals = (quotes) => {
    let total = 0;
    return quotes.map((quote) => {
      total += parseFloat(quote.size);
      return {
        ...quote,
        total,
      };
    });
  };

  // 連接WebSocket並處理訂單簿數據
  useEffect(() => {
    orderBookSocketRef.current = connectOrderBookSocket((data) => {
      if (data.data.type === "snapshot") {
        // 初始化訂單簿
        const sortedBids = data.data.bids
          .sort((a, b) => parseFloat(b[0]) - parseFloat(a[0])) // 價格降序排序
          .slice(0, 8)
          .map(([price, size]) => ({ price, size }));

        const sortedAsks = data.data.asks
          .sort((a, b) => parseFloat(a[0]) - parseFloat(b[0])) // 價格升序排序
          .slice(0, 8)
          .map(([price, size]) => ({ price, size }));

        setOrderBook({
          bids: calculateTotals(sortedBids),
          asks: calculateTotals(sortedAsks),
        });
      } else if (data.data.type === "delta") {
        // 處理增量更新
        setOrderBook((prevOrderBook) => {
          // 深拷貝之前的訂單簿
          const newBids = [...prevOrderBook.bids];
          const newAsks = [...prevOrderBook.asks];
          const newQuotesTemp = { bids: {}, asks: {} };
          const changedSizesTemp = { bids: {}, asks: {} };

          // 處理買入訂單更新
          data.data.bids.forEach(([price, size]) => {
            const priceFloat = parseFloat(price);
            const index = newBids.findIndex(
              (bid) => parseFloat(bid.price) === priceFloat
            );

            if (parseFloat(size) === 0) {
              // 移除數量為0的訂單
              if (index !== -1) {
                newBids.splice(index, 1);
              }
            } else {
              if (index !== -1) {
                // 比較新舊大小，標記變化
                const oldSize = parseFloat(newBids[index].size);
                const newSize = parseFloat(size);
                if (oldSize !== newSize) {
                  changedSizesTemp.bids[price] =
                    newSize > oldSize ? "increase" : "decrease";
                }
                newBids[index].size = size;
              } else {
                // 新的報價
                newBids.push({ price, size });
                newQuotesTemp.bids[price] = true;
              }
            }
          });

          // 處理賣出訂單更新
          data.data.asks.forEach(([price, size]) => {
            const priceFloat = parseFloat(price);
            const index = newAsks.findIndex(
              (ask) => parseFloat(ask.price) === priceFloat
            );

            if (parseFloat(size) === 0) {
              // 移除數量為0的訂單
              if (index !== -1) {
                newAsks.splice(index, 1);
              }
            } else {
              if (index !== -1) {
                // 比較新舊大小，標記變化
                const oldSize = parseFloat(newAsks[index].size);
                const newSize = parseFloat(size);
                if (oldSize !== newSize) {
                  changedSizesTemp.asks[price] =
                    newSize > oldSize ? "increase" : "decrease";
                }
                newAsks[index].size = size;
              } else {
                // 新的報價
                newAsks.push({ price, size });
                newQuotesTemp.asks[price] = true;
              }
            }
          });

          // 重新排序並限制數量
          const sortedBids = newBids
            .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
            .slice(0, 8);

          const sortedAsks = newAsks
            .sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
            .slice(0, 8);

          // 設置新的報價和變化大小以觸發動畫
          setNewQuotes(newQuotesTemp);
          setChangedSizes(changedSizesTemp);

          // 計算總量並返回新的訂單簿
          return {
            bids: calculateTotals(sortedBids),
            asks: calculateTotals(sortedAsks),
          };
        });
      }
    });

    return () => {
      if (orderBookSocketRef.current) {
        orderBookSocketRef.current.close();
      }
    };
  }, []);

  // 連接WebSocket並處理最後成交價數據
  useEffect(() => {
    lastPricesSocketRef.current = connectLastPriceSocket((data) => {
      setPrevLastPrice(lastPrice);
      setLastPrice(parseFloat(data.data[0].price));
    });

    return () => {
      if (lastPricesSocketRef.current) {
        lastPricesSocketRef.current.close();
      }
    };
  }, [lastPrice]);

  // 清除動畫標記
  useEffect(() => {
    const timer = setTimeout(() => {
      setNewQuotes({ bids: {}, asks: {} });
      setChangedSizes({ bids: {}, asks: {} });
    }, 1000);

    return () => clearTimeout(timer);
  }, [newQuotes, changedSizes]);

  // 獲取最後價格的背景和文字顏色

  return (
    <div className="order-book-container">
      <h2 className="order-book-title">Order Book</h2>
      <div className="order-book-content">
        {/* 賣出訂單 (Asks) - 反向顯示，從最低價到最高價 */}
        <OrderTable
          isBid={false}
          newQuotes={newQuotes}
          changedSizes={changedSizes}
          orderBook={orderBook}
        />
        
        <LastPrice prevLastPrice={prevLastPrice} lastPrice={lastPrice} />

        {/* 買入訂單 (Bids) */}
        <OrderTable
          isBid={true}
          newQuotes={newQuotes}
          changedSizes={changedSizes}
          orderBook={orderBook}
        />
      </div>
    </div>
  );
};

export default OrderBook;
