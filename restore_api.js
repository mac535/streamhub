const http = require('http');
const fs = require('fs');
const path = require('path');

const ARYAD_BRC = '32110100105SH';
const initialStocksPath = path.join(__dirname, 'server/data/stocks.json');
const initialStocks = JSON.parse(fs.readFileSync(initialStocksPath, 'utf8'));

http.get(`http://localhost:5000/api/stocks?brc=${ARYAD_BRC}&limit=1000`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const response = JSON.parse(data);
    const currentStocks = response.data;
    const currentItemNames = new Set(currentStocks.map(s => s.itemName));

    const missing = initialStocks.filter(s => !currentItemNames.has(s.itemName));
    console.log(`Found ${missing.length} missing items.`);
    
    missing.forEach(item => {
      console.log('Restoring:', item.itemName);
      const postData = JSON.stringify({
        ...item,
        brc: ARYAD_BRC,
        district: 'ALAPPUZHA'
      });

      const req = http.request({
        hostname: 'localhost',
        port: 5000,
        path: '/api/stocks',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (postRes) => {
        postRes.on('data', () => {}); // consume
      });
      req.write(postData);
      req.end();
    });
  });
});
