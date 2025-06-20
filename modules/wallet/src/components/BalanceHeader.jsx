// src/components/BalanceHeader.jsx
import React from 'react';

const BalanceHeader = ({ credits }) => {
  return (
    <div className="balance-header">
      <h2>You have <span>{credits}</span> credits</h2>
    </div>
  );
};

export default BalanceHeader;
