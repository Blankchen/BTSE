import { formatNumber } from "../../shared/format";
import "./index.scss";

export const OrderTable = ({ isBid, newQuotes, changedSizes, orderBook }) => {
  const newQuoteClassName = isBid ? "new-quote-bid" : "new-quote-ask";
  const priceClassName = isBid ? "price buy" : "price sell";
  const totalBarClassName = isBid ? "total-bar-bid" : "total-bar-ask";
  // 賣出訂單 (Asks) - 反向顯示，從最低價到最高價
  const tableData = isBid ? orderBook : orderBook.slice().reverse();
  // 獲取最大總量用於計算百分比條
  const maxTotal =
    orderBook.length > 0 ? orderBook[orderBook.length - 1].total : 0;

  // 計算百分比條
  const calculatePercentage = (total) => {
    return (total / maxTotal) * 100;
  };

  return (
    <>
      <table className="order-book-table">
        {!isBid && (
          <thead>
            <tr>
              <th>Price (USD)</th>
              <th>Size</th>
              <th>Total</th>
            </tr>
          </thead>
        )}
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
                <td className={`size ${sizeChange}`}>
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
    </>
  );
};
