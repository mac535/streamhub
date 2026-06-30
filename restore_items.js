const fs = require('fs');
const { db } = require('./server/src/config/database');
const path = require('path');

const ARYAD_BRC = '32110100105SH';

// Load initial stocks
const initialStocksPath = path.join(__dirname, 'server/data/stocks.json');
const initialStocks = JSON.parse(fs.readFileSync(initialStocksPath, 'utf8'));

// Get current stocks in memory for Aryad
const currentAryadStocks = db.stocks.findMany({ where: { brc: ARYAD_BRC } }).data;
const currentItemNames = new Set(currentAryadStocks.map(s => s.itemName));

let restoredCount = 0;

for (const initialStock of initialStocks) {
  if (!currentItemNames.has(initialStock.itemName)) {
    console.log(`Missing item found: ${initialStock.itemName}`);
    
    // Create it back in the database
    db.stocks.create({
      data: {
        ...initialStock,
        brc: ARYAD_BRC,
        district: 'ALAPPUZHA', // Aryad is in Alappuzha
        newQty: initialStock.newQty ?? initialStock.quantity,
        availableQty: initialStock.availableQty ?? initialStock.newQty ?? initialStock.quantity,
      }
    });
    restoredCount++;
  }
}

console.log(`Restored ${restoredCount} items.`);
