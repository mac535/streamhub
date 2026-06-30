const { db } = require('../../config/database');

/**
 * Get stocks with pagination and filters
 */
async function listStocks({ page = 1, limit = 20, district, brc, status, category, search, source }) {
  const skip = (page - 1) * limit;

  const where = {};
  if (district) where.district = district;
  if (brc) where.brc = brc;
  if (status) where.status = status;
  if (category) where.category = category;
  if (search) where.search = search;
  if (source) where.source = source;

  const [stocks, total] = await Promise.all([
    db.stock.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    db.stock.count({ where })
  ]);

  return {
    stocks,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get all stocks without pagination (for reports/downloads)
 */
async function getAllStocks(filters = {}) {
  const data = await db.stock.findMany({
    where: filters,
    orderBy: { createdAt: 'desc' },
  });
  return data;
}

/**
 * Create a single stock item
 */
async function createStock(data) {
  const stock = await db.stock.create({ data });
  return stock;
}

/**
 * Get single stock by id
 */
async function getStockById(id) {
  const stock = await db.stock.findFirst({ where: { id } });
  return stock;
  return null;
}

/**
 * Update stock by id
 */
async function updateStockById(id, data) {
  const result = await db.stock.update({
    where: { id },
    data
  });
  return result;
}

/**
 * Delete stock by id
 */
async function deleteStockById(id) {
  const result = await db.stock.delete({
    where: { id }
  });
  return result;
}

/**
 * Bulk create or update stock items (Upsert by itemName + brc)
 */
async function bulkUpsertStocks(items) {
  let updatedCount = 0;
  let createdCount = 0;
  const affectedStocks = [];

  for (const item of items) {
    const existing = await db.stock.findFirst({
      where: {
        itemName: item.itemName,
        brc: item.brc,
        district: item.district,
      }
    });

    if (existing) {
      // Update existing item (add quantity)
      const ex = existing;
      
      const currentNewQty = ex.newQty !== undefined ? ex.newQty : (ex.quantity || 0);
      const currentAvailableQty = ex.availableQty !== undefined ? ex.availableQty : currentNewQty;
      const currentQuantity = ex.quantity !== undefined ? ex.quantity : currentNewQty;
      
      const updated = await db.stock.update({
        where: { id: ex.id },
        data: {
          quantity: currentQuantity + item.quantity,
          newQty: currentNewQty + item.quantity,
          availableQty: currentAvailableQty + item.quantity,
          category: item.category || ex.category,
          uniqueId: item.uniqueId || ex.uniqueId,
          district: item.district || ex.district,
          status: 'ACTIVE'
        }
      });
      affectedStocks.push({ ...updated, _isNew: false });
      updatedCount++;
    } else {
      // Create new
      const created = await db.stock.create({
        data: {
          status: 'ACTIVE',
          newQty: item.quantity,
          availableQty: item.quantity,
          ...item
        }
      });
      affectedStocks.push({ ...created, _isNew: true });
      createdCount++;
    }
  }

  return { createdCount, updatedCount, stocks: affectedStocks };
}

/**
 * Bulk update stocks
 */
async function bulkUpdateStocks(data, where = {}) {
  const result = await db.stock.updateMany({ where, data });
  return result;
}

async function getStockHistory(filters = {}) {
  const data = await db.stockHistory.findMany({ where: filters });
  return data;
}

module.exports = {
  listStocks,
  getAllStocks,
  getStockHistory,
  createStock,
  getStockById,
  updateStockById,
  deleteStockById,
  bulkUpsertStocks,
  bulkUpdateStocks,
};
