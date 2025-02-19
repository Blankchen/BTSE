import "./index.scss";

export const LastPriceIcon = ({ prevLastPrice, lastPrice }) => {
  let arrow = "";
  if (!prevLastPrice || lastPrice === prevLastPrice) {
    arrow = "";
  } else if (lastPrice > prevLastPrice) {
    arrow = "down";
  } else {
    arrow = "up";
  }

  return (
    arrow && (
      <svg
        className={arrow}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        role="presentation"
        fill="none"
        fill-rule="nonzero"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <polyline points="19 12 12 19 5 12"></polyline>
      </svg>
    )
  );
};
