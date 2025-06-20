// src/utils/api.js
export const createUser = (data) => {
  return new Promise((resolve) => {
    console.log('POST /api/users', data);
    setTimeout(resolve, 1000);
  });
};

export const grantCredit = () => {
  return new Promise((resolve) => {
    console.log('POST /api/credits +1');
    setTimeout(resolve, 1000);
  });
};
