import React, { useState, useEffect, useRef } from "react";
import "./index.scss";
import { connectOrderBookSocket } from "../../api/socket";
import { OrderTable } from "../../components/OrderTable";
import { LastPrice } from "../LastPrice";
import {
  handleDeltaOrder,
  handleSnapshotAsks,
  handleSnapshotBids,
} from "../../shared/businessLogic";

export const OrderBook = () => {
  const [orderBook, setOrderBook] = useState({ bids: [], asks: [] });
  const [newQuotes, setNewQuotes] = useState({ bids: {}, asks: {} });
  const [changedSizes, setChangedSizes] = useState({ bids: {}, asks: {} });
  const orderBookSocketRef = useRef(null);

  // 連接WebSocket並處理訂單簿數據
  useEffect(() => {
    orderBookSocketRef.current = connectOrderBookSocket((data) => {
      if (data.data.type === "snapshot") {
        // 初始化訂單簿
        setOrderBook({
          bids: handleSnapshotBids(data.data.bids),
          asks: handleSnapshotAsks(data.data.asks),
        });
      } else if (data.data.type === "delta") {
        // 處理增量更新
        setOrderBook((prevOrderBook) => {
          const newQuotesTemp = { bids: {}, asks: {} };
          const changedSizesTemp = { bids: {}, asks: {} };

          const bids = handleDeltaOrder(
            prevOrderBook.bids,
            data.data.bids,
            newQuotesTemp.bids,
            changedSizesTemp.bids,
            (a, b) => parseFloat(b.price) - parseFloat(a.price) // 價格降序排序
          );
          const asks = handleDeltaOrder(
            prevOrderBook.asks,
            data.data.asks,
            newQuotesTemp.asks,
            changedSizesTemp.asks,
            (a, b) => parseFloat(a.price) - parseFloat(b.price) // 價格升序排序
          );

          // 設置新的報價和變化大小以觸發動畫
          setNewQuotes(newQuotesTemp);
          setChangedSizes(changedSizesTemp);

          // 計算總量並返回新的訂單簿
          return {
            bids,
            asks,
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

  // 清除動畫標記
  useEffect(() => {
    // 設置一個定時器來清除動畫標記
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
          newQuotes={newQuotes.asks}
          changedSizes={changedSizes.asks}
          orderBook={orderBook.asks}
        />

        <LastPrice />

        {/* 買入訂單 (Bids) */}
        <OrderTable
          isBid={true}
          newQuotes={newQuotes.bids}
          changedSizes={changedSizes.bids}
          orderBook={orderBook.bids}
        />
      </div>
    </div>
  );
};
