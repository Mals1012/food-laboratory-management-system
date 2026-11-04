const crypto = require('crypto');

const generateBatchId = (year = 2026) => {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `BATCH-${year}-${randomNum}`;
};

const generateTestId = (category = 'Chemical Analysis', year = 2026) => {
  let prefix = 'CH';
  if (category === 'Microbiological Testing') prefix = 'MB';
  else if (category === 'Heavy Metals and Contaminants') prefix = 'HM';
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `TEST-${prefix}-${year}-${randomNum}`;
};

const generateCOANumber = (year = 2026) => {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `COA-${year}-${randomNum}`;
};

module.exports = {
  generateBatchId,
  generateTestId,
  generateCOANumber,
};
