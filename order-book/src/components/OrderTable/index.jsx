import { formatNumber } from "../../shared/format";

export const OrderTable = (props) => {

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
          {orderBook.asks
            .slice()
            .reverse()
            .map((ask) => {
              const isNew = newQuotes.asks[ask.price];
              const sizeChange = changedSizes.asks[ask.price];
              const percentageWidth = calculatePercentage(
                ask.total,
                maxAskTotal
              );

              return (
                <tr
                  key={ask.price}
                  className={`ask-row ${isNew ? "new-quote-ask" : ""}`}
                >
                  <td className="price sell">{formatNumber(ask.price)}</td>
                  <td
                    className={`size ${
                      sizeChange === "increase" ? "size-increase" : ""
                    } ${sizeChange === "decrease" ? "size-decrease" : ""}`}
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
  );
};
