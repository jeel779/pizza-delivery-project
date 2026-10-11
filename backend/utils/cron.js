const cron = require('node-cron');
const Inventory = require('../models/Inventory');
const sendEmail = require('./mailer');

// Set to keep track of items we've already sent notifications for recently to prevent spamming
// In a production app, this could be stored in DB or Redis with a TTL
const notifiedItems = new Set();

const checkInventoryLevels = async () => {
  try {
    console.log('[CRON] Running inventory threshold check...');
    
    // Fetch all items from inventory
    const items = await Inventory.find({});
    const lowStockItems = [];

    for (const item of items) {
      const threshold = item.threshold !== undefined ? item.threshold : (Number(process.env.STOCK_THRESHOLD) || 20);
      
      if (item.stock < threshold) {
        lowStockItems.push({
          name: item.name,
          category: item.category,
          stock: item.stock,
          threshold: threshold,
        });
      }
    }

    if (lowStockItems.length > 0) {
      // Filter out items that have already been notified unless stock changed or it's a new check cycle
      const itemsToNotify = lowStockItems.filter(item => !notifiedItems.has(item.name));

      if (itemsToNotify.length > 0) {
        console.warn(`[WARNING] Low stock detected for: ${itemsToNotify.map(i => `${i.name} (${i.stock}/${i.threshold})`).join(', ')}`);
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@pizza.com';
        
        const subject = '⚠️ Pizza Store Inventory Alert: Low Stock Warning';
        
        let text = `The following inventory items are below the stock threshold:\n\n`;
        itemsToNotify.forEach(item => {
          text += `- Item: ${item.name} | Category: ${item.category} | Current Stock: ${item.stock} | Alert Threshold: ${item.threshold}\n`;
        });
        text += `\nPlease log in to the admin panel and update the stock manually as soon as possible.`;

        let html = `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #d32f2f; border-radius: 5px; background-color: #ffebee;">
            <h2 style="color: #c62828; margin-top: 0;">⚠️ Low Stock Inventory Alert</h2>
            <p>Dear Admin,</p>
            <p>The following ingredients in your inventory have fallen below their configured stock threshold:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background-color: #c62828; color: #fff; text-align: left;">
                  <th style="padding: 10px; border: 1px solid #ddd;">Ingredient</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Category</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Current Stock</th>
                  <th style="padding: 10px; border: 1px solid #ddd;">Warning Threshold</th>
                </tr>
              </thead>
              <tbody>
        `;
        
        itemsToNotify.forEach(item => {
          html += `
            <tr style="background-color: #fff;">
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${item.name}</td>
              <td style="padding: 10px; border: 1px solid #ddd; text-transform: capitalize;">${item.category}</td>
              <td style="padding: 10px; border: 1px solid #ddd; color: #c62828; font-weight: bold;">${item.stock}</td>
              <td style="padding: 10px; border: 1px solid #ddd;">${item.threshold}</td>
            </tr>
          `;
        });

        html += `
              </tbody>
            </table>
            <p>Please update stock levels via the admin portal to ensure uninterrupted pizza production.</p>
          </div>
        `;

        await sendEmail({
          email: adminEmail,
          subject,
          text,
          html,
        });

        // Add to notified list to prevent double email spamming
        itemsToNotify.forEach(item => notifiedItems.add(item.name));
      }
    } else {
      // Clear notified list if everything is above threshold now
      notifiedItems.clear();
      console.log('[CRON] All inventory items are well-stocked.');
    }
  } catch (error) {
    console.error('[CRON ERROR] Failed to check inventory threshold levels:', error);
  }
};

const initCronJobs = () => {
  // Run once immediately on startup
  setTimeout(checkInventoryLevels, 5000);

  // Schedule to run every 5 minutes
  // Cron expression: '*/5 * * * *'
  cron.schedule('*/5 * * * *', checkInventoryLevels);
  console.log('[CRON] Scheduled inventory threshold cron job to run every 5 minutes.');
};

module.exports = { initCronJobs, checkInventoryLevels };
