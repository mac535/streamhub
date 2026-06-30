const { db } = require('./server/src/config/database');
const stocksService = require('./server/src/modules/stocks/stocks.service');

async function test() {
  db.stocks.create({ data: {
    itemName: 'Test Item',
    brc: 'BRC1',
    quantity: 5,
    newQty: 5,
    availableQty: 3,
    usedQty: 2
  }});

  const result = await stocksService.bulkUpsertStocks([
    {
      itemName: 'Test Item',
      brc: 'BRC1',
      quantity: 10
    }
  ]);

  console.log(result.stocks[0]);
}

test();
