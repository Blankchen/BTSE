import React from 'react';
import OrderBook from './OrderBook';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>BTSE Order Book</h1>
        <p>Market: BTCPFC</p>
      </header>
      <main>
        <OrderBook />
      </main>
      <footer>
        <p>Last Update: 2023/7/28 *Update market symbol `BTC-PERP` → `BTCPFC`</p>
      </footer>
    </div>
  );
}

export default App;
