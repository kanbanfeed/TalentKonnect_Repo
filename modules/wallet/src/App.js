// src/App.js
import React, { useEffect, useState } from 'react';
import './App.css';
import { fetchBalance } from './utils/api';
import BalanceHeader from './components/BalanceHeader';
import LedgerTable from './components/LedgerTable';

function App() {
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalance().then(res => {
      setCredits(res.credits);
      setLoading(false);
    });
  }, []);

  return (
    <div className="App">
      <h1>Credit Wallet</h1>
      {loading ? <p>Loading balance...</p> : <BalanceHeader credits={credits} />}
      <LedgerTable />
    </div>
  );
}

export default App;
