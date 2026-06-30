const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new PrismaClient();

const DATA_DIR = path.join(__dirname, '../../data');
const loadJSON = (filename) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error loading ${filename}:`, err);
  }
  return [];
};

async function seedDatabase() {
  try {
    const userCount = await db.user.count();
    if (userCount === 0) {
      console.log('Database is empty. Seeding initial data from JSON files...');
      
      const adminPassword = await bcrypt.hash('Admin@123', 12);
      const demoPassword = await bcrypt.hash('Demo@123', 12);
      const rioPassword = await bcrypt.hash('123rio', 12);

      const mockUsers = [
        {
          id: 'mock-admin',
          email: 'admin@stream.edu',
          username: 'admin',
          password: adminPassword,
          name: 'System Administrator',
          role: 'ADMIN',
          isActive: true
        },
        {
          id: 'mock-expert',
          email: 'expert@stream.edu',
          username: 'expert',
          password: demoPassword,
          name: 'Demo Expert',
          role: 'EXPERT',
          isActive: true
        },
        {
          id: 'rio',
          email: 'rio@stream.edu',
          username: 'rio',
          password: rioPassword,
          name: 'Rio Roy',
          role: 'EXPERT',
          isActive: true
        }
      ];

      const activeExperts = loadJSON('experts.json');
      const activeAdmins = loadJSON('admins.json');
      const hubUsers = loadJSON('hub_users.json');
      const allBrcs = loadJSON('brcs.json');

      const allUsers = [...mockUsers, ...activeExperts, ...activeAdmins, ...hubUsers, ...allBrcs].map(u => ({
        id: u.id,
        email: u.email || `${u.username || u.id}@stream.edu`,
        username: u.username || u.id,
        password: u.password || adminPassword,
        name: u.name || u.brcName || u.hubName || 'Unknown User',
        role: u.role || 'EXPERT',
        isActive: u.isActive !== undefined ? u.isActive : true
      }));

      const uniqueUsers = [];
      const seenIds = new Set();
      const seenEmails = new Set();
      const seenUsernames = new Set();
      
      for (const u of allUsers) {
        if (!seenIds.has(u.id) && !seenEmails.has(u.email) && !seenUsernames.has(u.username)) {
          uniqueUsers.push(u);
          seenIds.add(u.id);
          seenEmails.add(u.email);
          seenUsernames.add(u.username);
        }
      }

      await db.user.createMany({
        data: uniqueUsers,
        skipDuplicates: true
      });
      
      console.log('✅ Users seeded successfully!');
    }

    const stockCount = await db.stock.count();
    if (stockCount === 0) {
      const initialStocks = loadJSON('stocks.json');
      const allBrcs = loadJSON('brcs.json');
      
      if (initialStocks && initialStocks.length > 0) {
        const stocksToInsert = [];
        const crypto = require('crypto');
        
        if (!allBrcs || allBrcs.length === 0) {
          stocksToInsert.push(...initialStocks.map(s => ({
            id: crypto.randomUUID(),
            itemCode: s.itemCode,
            itemName: s.itemName || 'Unknown Item',
            quantity: s.quantity || 0,
            category: s.category,
            newQty: s.newQty || null,
            section: s.section,
            label: s.label,
            img: s.img,
            spaceCode: s.spaceCode,
            status: s.status,
            availableQty: s.availableQty || s.quantity || 0,
            baseline: s.baseline || 0,
            district: s.district || '',
            brc: s.brc || ''
          })));
        } else {
          for (const brc of allBrcs) {
            stocksToInsert.push(...initialStocks.map(s => ({
              id: crypto.randomUUID(),
              itemCode: s.itemCode,
              itemName: s.itemName || 'Unknown Item',
              quantity: s.quantity || 0,
              category: s.category,
              newQty: s.newQty || null,
              section: s.section,
              label: s.label,
              img: s.img,
              spaceCode: s.spaceCode,
              status: s.status,
              availableQty: s.availableQty || s.quantity || 0,
              baseline: s.baseline || 0,
              district: brc.district,
              brc: brc.brcName
            })));
          }
        }
        
        const chunkSize = 5000;
        for (let i = 0; i < stocksToInsert.length; i += chunkSize) {
          await db.stock.createMany({
            data: stocksToInsert.slice(i, i + chunkSize),
            skipDuplicates: true
          });
        }
        console.log('✅ Stocks seeded successfully!');
      }
    }
    
    const eventCount = await db.event.count();
    if (eventCount === 0) {
       const initialEvents = loadJSON('events.json');
       if (initialEvents && initialEvents.length > 0) {
          await db.event.createMany({
             data: initialEvents.map(e => ({
                id: e.id,
                brcCode: e.brcCode || '',
                venueType: e.venueType || 'SELECTED_BRC',
                venueValue: e.venueValue || '',
                name: e.name || 'Event',
                date: e.date || new Date().toISOString(),
                description: e.description,
                teachersCount: e.teachersCount || 0,
                studentsCount: e.studentsCount || 0,
                latitude: e.latitude,
                longitude: e.longitude,
                locationTimestamp: e.locationTimestamp,
                tag: e.tag,
                customTag: e.customTag,
                photos: e.photos || [],
                status: e.status || 'DRAFT',
                reportPdf: e.reportPdf,
                createdBy: e.createdBy || 'mock-expert',
                creatorRole: e.creatorRole
             })),
             skipDuplicates: true
          });
          console.log('✅ Events seeded successfully!');
       }
    }

  } catch (err) {
    console.error('Failed to seed database:', err);
  }
}

module.exports = { db, seedDatabase };
