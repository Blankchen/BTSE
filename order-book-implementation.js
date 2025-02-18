import React, { useState, useEffect, useRef } from 'react';
import './OrderBook.css';

// 格式化數字，添加千位分隔符
const formatNumber = (num, decimals = 2) => {
  return Number(num).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

const OrderBook = () => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [lastPrice, setLastPrice] = useState(null);
  const [prevLastPrice, setPrevLastPrice] = useState(null);
  const [newQuotes, setNewQuotes] = useState({ bids: {}, asks: {} });
  const [changedSizes, setChangedSizes] = useState({ bids: {}, asks: {} });
  const orderBookRef = useRef(null);
  const seqNumRef = useRef(null);
  const lastPricesSocketRef = useRef(null);
  const orderBookSocketRef = useRef(null);

  // 計算累計總量
  const calculateTotals = (quotes) => {
    let total = 0;
    return quotes.map((quote) => {
      total += parseFloat(quote.size);
      return {
        ...quote,
        total
      };
    });
  };

  // 計算百分比條
  const calculatePercentage = (total, maxTotal) => {
    return (total / maxTotal) * 100;
  };

  // 連接WebSocket並處理訂單簿數據
  useEffect(() => {
    const connectOrderBookSocket = () => {
      orderBookSocketRef.current = new WebSocket('wss://ws.btse.com/ws/oss/futures');

      orderBookSocketRef.current.onopen = () => {
        console.log('OrderBook WebSocket connected');
        orderBookSocketRef.current.send(JSON.stringify({
          op: 'subscribe',
          args: ['update:BTCPFC']
        }));
      };

      orderBookSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.data && data.data.type) {
          if (data.data.type === 'snapshot') {
            seqNumRef.current = data.data.seqNum;

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
              asks: calculateTotals(sortedAsks)
            });
          } else if (data.data.type === 'delta') {
            // 檢查序列號連續性
            if (data.data.prevSeqNum !== seqNumRef.current) {
              console.log('Sequence mismatch, resubscribing...');
              orderBookSocketRef.current.send(JSON.stringify({
                op: 'unsubscribe',
                args: ['update:BTCPFC']
              }));
              orderBookSocketRef.current.send(JSON.stringify({
                op: 'subscribe',
                args: ['update:BTCPFC']
              }));
              return;
            }

            seqNumRef.current = data.data.seqNum;

            // 處理增量更新
            setOrderBook(prevOrderBook => {
              // 深拷貝之前的訂單簿
              const newBids = [...prevOrderBook.bids];
              const newAsks = [...prevOrderBook.asks];
              const newQuotesTemp = { bids: {}, asks: {} };
              const changedSizesTemp = { bids: {}, asks: {} };

              // 處理買入訂單更新
              data.data.bids.forEach(([price, size]) => {
                const priceFloat = parseFloat(price);
                const index = newBids.findIndex(bid => parseFloat(bid.price) === priceFloat);

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
                      changedSizesTemp.bids[price] = newSize > oldSize ? 'increase' : 'decrease';
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
                const index = newAsks.findIndex(ask => parseFloat(ask.price) === priceFloat);

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
                      changedSizesTemp.asks[price] = newSize > oldSize ? 'increase' : 'decrease';
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
                asks: calculateTotals(sortedAsks)
              };
            });
          }
        }
      };

      orderBookSocketRef.current.onerror = (error) => {
        console.error('OrderBook WebSocket error:', error);
      };

      orderBookSocketRef.current.onclose = () => {
        console.log('OrderBook WebSocket disconnected. Reconnecting...');
        setTimeout(connectOrderBookSocket, 5000);
      };
    };

    connectOrderBookSocket();

    return () => {
      if (orderBookSocketRef.current) {
        orderBookSocketRef.current.close();
      }
    };
  }, []);

  // 連接WebSocket並處理最後成交價數據
  useEffect(() => {
    const connectLastPriceSocket = () => {
      lastPricesSocketRef.current = new WebSocket('wss://ws.btse.com/ws/futures');

      lastPricesSocketRef.current.onopen = () => {
        console.log('Last Price WebSocket connected');
        lastPricesSocketRef.current.send(JSON.stringify({
          op: 'subscribe',
          args: ['tradeHistoryApi:BTCPFC']
        }));
      };

      lastPricesSocketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setPrevLastPrice(lastPrice);
          setLastPrice(parseFloat(data.data[0].price));
        }
      };

      lastPricesSocketRef.current.onerror = (error) => {
        console.error('Last Price WebSocket error:', error);
      };

      lastPricesSocketRef.current.onclose = () => {
        console.log('Last Price WebSocket disconnected. Reconnecting...');
        setTimeout(connectLastPriceSocket, 5000);
      };
    };

    connectLastPriceSocket();

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
  const getLastPriceStyle = () => {
    if (!prevLastPrice || lastPrice === prevLastPrice) {
      return {
        color: '#F0F4F8',
        backgroundColor: 'rgba(134, 152, 170, 0.12)'
      };
    } else if (lastPrice > prevLastPrice) {
      return {
        color: '#00b15d',
        backgroundColor: 'rgba(16, 186, 104, 0.12)'
      };
    } else {
      return {
        color: '#FF5B5A',
        backgroundColor: 'rgba(255, 90, 90, 0.12)'
      };
    }
  };

  // 獲取最大總量用於計算百分比條
  const maxBidTotal = orderBook.bids.length > 0 ? orderBook.bids[orderBook.bids.length - 1].total : 0;
  const maxAskTotal = orderBook.asks.length > 0 ? orderBook.asks[orderBook.asks.length - 1].total : 0;

  return (
    <div className="order-book-container" ref={orderBookRef}>
      <h2 className="order-book-title">Order Book</h2>
      <div className="last-price-container" style={getLastPriceStyle()}>
        <span>Last Price: {lastPrice ? formatNumber(lastPrice) : '-'}</span>
      </div>
      
      <div className="order-book-content">
        {/* 賣出訂單 (Asks) - 反向顯示，從最低價到最高價 */}
        <div className="order-book-half">
          <table className="order-book-table">
            <thead>
              <tr>
                <th>Price</th>
                <th>Size</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderBook.asks.slice().reverse().map((ask) => {
                const isNew = newQuotes.asks[ask.price];
                const sizeChange = changedSizes.asks[ask.price];
                const percentageWidth = calculatePercentage(ask.total, maxAskTotal);
                
                return (
                  <tr
                    key={ask.price}
                    className={`ask-row ${isNew ? 'new-quote-ask' : ''}`}
                  >
                    <td className="price sell">
                      {formatNumber(ask.price)}
                    </td>
                    <td 
                      className={`size ${sizeChange === 'increase' ? 'size-increase' : ''} ${sizeChange === 'decrease' ? 'size-decrease' : ''}`}
                    >
                      {formatNumber(ask.size)}
                    </td>
                    <td className="total">
                      <div className="total-bar-container">
                        <div
                          className="total-bar-ask"
                          style={{ width: `${percentageWidth}%` }}
                        ></div>
                        <span>{formatNumber(ask.total)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {/* 買入訂單 (Bids) */}
        <div className="order-book-half">
          <table className="order-book-table">
            <thead>
              <tr>
                <th>Price</th>
                <th>Size</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {orderBook.bids.map((bid) => {
                const isNew = newQuotes.bids[bid.price];
                const sizeChange = changedSizes.bids[bid.price];
                const percentageWidth = calculatePercentage(bid.total, maxBidTotal);
                
                return (
                  <tr
                    key={bid.price}
                    className={`bid-row ${isNew ? 'new-quote-bid' : ''}`}
                  >
                    <td className="price buy">
                      {formatNumber(bid.price)}
                    </td>
                    <td 
                      className={`size ${sizeChange === 'increase' ? 'size-increase' : ''} ${sizeChange === 'decrease' ? 'size-decrease' : ''}`}
                    >
                      {formatNumber(bid.size)}
                    </td>
                    <td className="total">
                      <div className="total-bar-container">
                        <div
                          className="total-bar-bid"
                          style={{ width: `${percentageWidth}%` }}
                        ></div>
                        <span>{formatNumber(bid.total)}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderBook;
