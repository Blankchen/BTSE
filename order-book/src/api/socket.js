const onCloseTimeout = 5000;
// Last Update: 2023/7/28 *Update market symbol BTC-PERP → BTCPFC
const symbolGrouping = "BTCPFC";

// API doc: https://btsecom.github.io/docs/futures/en/#orderbook-incremental-updates
let seqNumRef = null;
export const connectOrderBookSocket = (cb) => {
  const ref = new WebSocket(`${import.meta.env.VITE_SOCKET_URL}/oss/futures`);

  ref.onopen = () => {
    console.log("OrderBook WebSocket connected");
    ref.send(
      JSON.stringify({
        op: "subscribe",
        args: [`update:${symbolGrouping}`],
      })
    );
  };

  ref.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data?.data?.type) {
      // Re-subscribe topic to get new snapshot if prevSeqNum of new data doesn’t match last data’s seqNum
      // if (
      //   seqNumRef &&
      //   data.data.type === "delta" &&
      //   data.data.prevSeqNum !== seqNumRef
      // ) {
      //   console.log("Sequence mismatch, resubscribing...");
      //   ref.send(
      //     JSON.stringify({
      //       op: "unsubscribe",
      //       args: [`update:${symbolGrouping}`],
      //     })
      //   );
      //   ref.send(
      //     JSON.stringify({
      //       op: "subscribe",
      //       args: [`update:${symbolGrouping}`],
      //     })
      //   );
      //   return;
      // }

      seqNumRef = data.data.seqNum;

      cb(data);
    }
  };

  ref.onerror = (error) => {
    console.error("OrderBook WebSocket error:", error);
  };

  ref.onclose = () => {
    console.log("OrderBook WebSocket disconnected. Reconnecting...");
    setTimeout(() => connectOrderBookSocket(cb), onCloseTimeout);
  };

  return ref;
};

// API doc: https://btsecom.github.io/docs/futures/en/#public-trade-fills
export const connectLastPriceSocket = (cb) => {
  const ref = new WebSocket(`${import.meta.env.VITE_SOCKET_URL}/futures`);

  ref.onopen = () => {
    console.log("Last Price WebSocket connected");
    ref.send(
      JSON.stringify({
        op: "subscribe",
        args: [`tradeHistoryApi:${symbolGrouping}`],
      })
    );
  };

  ref.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      cb(data);
    }
  };

  ref.onerror = (error) => {
    console.error("Last Price WebSocket error:", error);
  };

  ref.onclose = () => {
    console.log("Last Price WebSocket disconnected. Reconnecting...");
    setTimeout(() => connectLastPriceSocket(cb), onCloseTimeout);
  };

  return ref;
};
