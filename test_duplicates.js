const { db, seedDatabase } = require('./server/src/config/database');

async function test() {
  await seedDatabase();
  const items = db.stocks.findMany().data;
  const nameCounts = {};
  let duplicates = 0;

  items.forEach(item => {
    const key = `${item.itemName}-${item.brc}`;
    if (!nameCounts[key]) nameCounts[key] = 0;
    nameCounts[key]++;
  });

  for (const [key, count] of Object.entries(nameCounts)) {
    if (count > 1) {
      console.log(`Duplicate found: ${key} (${count})`);
      duplicates++;
    }
  }

  console.log(`Total items: ${items.length}`);
  console.log(`Total duplicates: ${duplicates}`);
}

test();
