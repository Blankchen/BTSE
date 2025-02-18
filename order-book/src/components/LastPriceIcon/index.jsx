export const LastPriceIcon = ({ prevLastPrice, lastPrice }) => {
  let arrow = "";
  if (!prevLastPrice || lastPrice === prevLastPrice) {
    arrow = "";
  } else if (lastPrice > prevLastPrice) {
    arrow = "M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3";
  } else if (lastPrice < prevLastPrice) {
    arrow = "M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18";
  }
  return (
    arrow && (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d={arrow} />
      </svg>
    )
  );
};
