import "./index.scss";
import { formatNumber } from "../../shared/format";
import { LastPriceIcon } from "../LastPriceIcon";

export const LastPrice = ({ prevLastPrice, lastPrice }) => {
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
