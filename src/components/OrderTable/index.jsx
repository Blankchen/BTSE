import { formatNumber } from "../../shared/format";
import "./index.scss";

export const OrderTable = (props) => {
  const newQuoteClassName = props.isBid ? "new-quote-bid" : "new-quote-ask";
  const priceClassName = props.isBid ? "price buy" : "price sell";
  const totalBarClassName = props.isBid ? "total-bar-bid" : "total-bar-ask";
  const newQuotes = props.isBid ? props.newQuotes.bids : props.newQuotes.asks;
  const changedSizes = props.isBid
    ? props.changedSizes.bids
    : props.changedSizes.asks;
  const orderBook = props.orderBook;
  const tableData = props.isBid
    ? orderBook.bids
    : orderBook.asks.slice().reverse();
  // 獲取最大總量用於計算百分比條
  const maxTotal = props.isBid
    ? orderBook.bids.length > 0
      ? orderBook.bids[orderBook.bids.length - 1].total
      : 0
    : orderBook.asks.length > 0
    ? orderBook.asks[orderBook.asks.length - 1].total
    : 0;

  // 計算百分比條
  const calculatePercentage = (total) => {
    return (total / maxTotal) * 100;
  };

  return (
    <div className="order-book-half">
      <table className="order-book-table">
        <thead>
          <tr>
            <th>Price (USD)</th>
            <th>Size</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => {
            const isNew = newQuotes[row.price];
            const sizeChange = changedSizes[row.price];
            const percentageWidth = calculatePercentage(row.total);

            return (
              <tr
                key={row.price}
                className={`${isNew ? newQuoteClassName : ""}`}
              >
                <td className={priceClassName}>{formatNumber(row.price)}</td>
                <td
                  className={`size ${
                    sizeChange === "increase" ? "size-increase" : ""
                  } ${sizeChange === "decrease" ? "size-decrease" : ""}`}
                >
                  {formatNumber(row.size)}
                </td>
                <td className="total">
                  <div className="total-bar-container">
                    <div
                      className={totalBarClassName}
                      style={{ width: `${percentageWidth}%` }}
                    ></div>
                    <span>{formatNumber(row.total)}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
