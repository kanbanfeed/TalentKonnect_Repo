// src/utils/api.js
export const fetchBalance = () => {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ credits: 27 }), 1000);
  });
};

export const fetchLedger = (page = 1) => {
  const itemsPerPage = 5;
  const allEntries = Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
    source: ['Tip', 'Post', 'Referral'][i % 3],
    credits: (i % 2 === 0 ? '+1' : '-1'),
  }));

  const paginated = allEntries.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  return new Promise((resolve) => {
    setTimeout(() => resolve({ entries: paginated, total: allEntries.length }), 1000);
  });
};
