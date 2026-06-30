const { db, seedDatabase } = require('./server/src/config/database');
const stocksService = require('./server/src/modules/stocks/stocks.service');

async function test() {
  await seedDatabase();
  console.log('Total seeded:', db.stocks.findMany().data.length);

  const before = db.stocks.findMany({ where: { itemName: 'Burg Strips M', brc: '32110100105SH' } });
  console.log('Before count:', before.data.length, 'Qty:', before.data[0]?.newQty);

  const { createdCount, updatedCount, stocks } = await stocksService.bulkUpsertStocks([{
    itemName: 'Burg Strips M',
    brc: '32110100105SH',
    quantity: 50
  }]);

  console.log('Created:', createdCount, 'Updated:', updatedCount);

  const after = db.stocks.findMany({ where: { itemName: 'Burg Strips M', brc: '32110100105SH' } });
  console.log('After count:', after.data.length, 'Qty:', after.data[0]?.newQty);
}
test();
