import "./index.scss";
import { formatNumber } from "../../shared/format";
import { LastPriceIcon } from "../../components/LastPriceIcon";
import { useEffect, useRef, useState } from "react";
import { connectLastPriceSocket } from "../../api/socket";

export const LastPrice = () => {
  const [lastPrice, setLastPrice] = useState(null);
  const [prevLastPrice, setPrevLastPrice] = useState(null);
  const lastPricesSocketRef = useRef(null);

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

  const getLastPriceStyle = () => {
    if (!prevLastPrice || lastPrice === prevLastPrice) {
      return {};
    } else if (lastPrice > prevLastPrice) {
      return {
        color: "var(--buy-text-color)",
        backgroundColor: "var(--buy-accumulative-color)",
      };
    } else {
      return {
        color: "var(--sell-text-color)",
        backgroundColor: "var(--sell-accumulative-color)",
      };
    }
  };

  return (
    <div className="last-price-container" style={getLastPriceStyle()}>
      <span>{lastPrice ? formatNumber(lastPrice) : "-"}</span>
      <span className="icon">
        <LastPriceIcon prevLastPrice={prevLastPrice} lastPrice={lastPrice} />
      </span>
    </div>
  );
};
