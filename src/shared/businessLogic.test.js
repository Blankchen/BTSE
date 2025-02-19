import {
  calculateTotals,
  handleSnapshotBids,
  handleSnapshotAsks,
  handleDeltaOrder,
} from "./businessLogic";

describe("calculateTotals", () => {
  it("should calculate the total", () => {
    const from = [
      {
        size: 100,
      },
      {
        size: 200,
      },
    ];
    const to = [
      {
        size: 100,
        total: 100,
      },
      {
        size: 200,
        total: 300,
      },
    ];

    expect(calculateTotals(from)).toEqual(to);
  });
});

describe("handleSnapshotBids", () => {
  it("should sum up quote size from highest price quote to the lowest", () => {
    const from = [
      ["59252.5", "0.06865"],
      ["59249.0", "0.24000"],
      ["59235.5", "0.16073"],
      ["59235.0", "0.26626"],
      ["59233.0", "0.50000"],
    ];
    const to = [
      {
        price: "59252.5",
        size: "0.06865",
        total: 0.06865,
      },
      {
        price: "59249.0",
        size: "0.24000",
        total: 0.30865,
      },
      {
        price: "59235.5",
        size: "0.16073",
        total: 0.46938,
      },
      {
        price: "59235.0",
        size: "0.26626",
        total: 0.7356400000000001,
      },
      {
        price: "59233.0",
        size: "0.50000",
        total: 1.23564,
      },
    ];

    expect(handleSnapshotBids(from)).toEqual(to);
  });

  it("should get the first 8 bids", () => {
    const from = [
      ["59252.5", "0.06865"],
      ["59249.0", "0.24000"],
      ["59235.5", "0.16073"],
      ["59235.0", "0.26626"],
      ["5923.0", "0.50000"],
      ["5233.0", "0.50000"],
      ["59233.0", "0.50000"],
      ["5233.0", "0.50000"],
      ["9233.0", "0.50000"],
      ["5933.0", "0.50000"],
      ["59233.0", "0.50000"],
      ["533.0", "0.50000"],
      ["5933.0", "0.50000"],
      ["5233.0", "0.50000"],
    ];
    const to = [
      {
        price: "59252.5",
        size: "0.06865",
        total: 0.06865,
      },
      {
        price: "59249.0",
        size: "0.24000",
        total: 0.30865,
      },
      {
        price: "59235.5",
        size: "0.16073",
        total: 0.46938,
      },
      {
        price: "59235.0",
        size: "0.26626",
        total: 0.7356400000000001,
      },
      {
        price: "59233.0",
        size: "0.50000",
        total: 1.23564,
      },
      {
        price: "59233.0",
        size: "0.50000",
        total: 1.73564,
      },
      {
        price: "9233.0",
        size: "0.50000",
        total: 2.23564,
      },
      {
        price: "5933.0",
        size: "0.50000",
        total: 2.73564,
      },
    ];

    expect(handleSnapshotBids(from)).toEqual(to);
  });
});

describe("handleSnapshotAsks", () => {
  it("should sum up quote size from lowest price quote to the highest", () => {
    const from = [
      ["59292.0", "0.50000"],
      ["59285.5", "0.24000"],
      ["59285.0", "0.15598"],
      ["59278.5", "0.01472"],
    ];
    const to = [
      {
        price: "59278.5",
        size: "0.01472",
        total: 0.01472,
      },
      {
        price: "59285.0",
        size: "0.15598",
        total: 0.17070000000000002,
      },
      {
        price: "59285.5",
        size: "0.24000",
        total: 0.4107,
      },
      {
        price: "59292.0",
        size: "0.50000",
        total: 0.9107000000000001,
      },
    ];

    expect(handleSnapshotAsks(from)).toEqual(to);
  });
});

describe("handleDeltaOrder", () => {
  it("should sum up quote size from highest price quote to the lowest", () => {
    const from = [
      ["59252.5", "0.06865"],
      ["59249.0", "0.24000"],
      ["59235.5", "0.16073"],
      ["59235.0", "0.26626"],
      ["59233.0", "0.50000"],
    ];
    const to = [
      {
        price: "59252.5",
        size: "0.06865",
        total: 0.06865,
      },
      {
        price: "59249.0",
        size: "0.24000",
        total: 0.30865,
      },
      {
        price: "59235.5",
        size: "0.16073",
        total: 0.46938,
      },
      {
        price: "59235.0",
        size: "0.26626",
        total: 0.7356400000000001,
      },
      {
        price: "59233.0",
        size: "0.50000",
        total: 1.23564,
      },
    ];

    expect(handleDeltaOrder([], from)).toEqual(to);
  });

  it("should add newQuotesTemp ", () => {
    const oldFrom = [{ price: "59252.5", size: "0.06865" }];
    const from = [["60000", "0.06050"]];
    let newQuotesTemp = {};

    const to = [
      {
        price: "60000",
        size: "0.06050",
        total: 0.0605,
      },
      {
        price: "59252.5",
        size: "0.06865",
        total: 0.12915,
      },
    ];

    const result = handleDeltaOrder(oldFrom, from, newQuotesTemp);

    expect(result).toEqual(to);
    expect(newQuotesTemp).toEqual({ 60000: true });
  });

  it("should changedSizesTemp decrease", () => {
    const oldFrom = [{ price: "59252.5", size: "0.06865" }];
    const from = [["59252.5", "0.06065"]];
    let changedSizesTemp = {};

    const to = [
      {
        price: "59252.5",
        size: "0.06065",
        total: 0.06065,
      },
    ];

    const result = handleDeltaOrder(oldFrom, from, {}, changedSizesTemp);

    expect(result).toEqual(to);
    expect(changedSizesTemp).toEqual({ 59252.5: "decrease" });
  });

  it("should changedSizesTemp increase", () => {
    const oldFrom = [{ price: "59252.5", size: "0.06865" }];
    const from = [["59252.5", "0.07065"]];
    let changedSizesTemp = {};

    const to = [
      {
        price: "59252.5",
        size: "0.07065",
        total: 0.07065,
      },
    ];

    const result = handleDeltaOrder(oldFrom, from, {}, changedSizesTemp);

    expect(result).toEqual(to);
    expect(changedSizesTemp).toEqual({ 59252.5: "increase" });
  });
});
