// src/components/LedgerTable.jsx
import React, { useEffect, useState } from 'react';
import { fetchLedger } from '../utils/api';

const LedgerTable = () => {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    fetchLedger(page).then((res) => {
      setLedger(res.entries);
      setTotal(res.total);
      setLoading(false);
    });
  }, [page]);

  const totalPages = Math.ceil(total / 5);

  return (
    <div className="ledger">
      <h3>Credit History</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Credits</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map(entry => (
                <tr key={entry.id}>
                  <td>{entry.date}</td>
                  <td>{entry.source}</td>
                  <td>{entry.credits}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={() => setPage(page - 1)} disabled={page === 1}>Prev</button>
            <span>Page {page}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>Next</button>
          </div>
        </>
      )}
    </div>
  );
};

export default LedgerTable;
