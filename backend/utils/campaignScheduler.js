import database from "../database/db.js";

export const startCampaignScheduler = () => {
  console.log("⏱️  Realtime Campaign Scheduler Initialized.");

  const checkCampaigns = async () => {
    try {
      // 1. Deactivate expired campaigns
      const expiredRes = await database.query(`
        UPDATE sales_campaigns 
        SET is_active = false 
        WHERE is_active = true AND end_date < CURRENT_TIMESTAMP
        RETURNING id, title
      `);
      if (expiredRes.rows.length > 0) {
        console.log(`⏱️  Scheduler: Deactivated ${expiredRes.rows.length} expired campaign(s):`);
        expiredRes.rows.forEach(c => console.log(`   - [DEACTIVATED] ${c.title}`));
      }

      // 2. Activate approved and scheduled campaigns
      const activeRes = await database.query(`
        UPDATE sales_campaigns 
        SET is_active = true 
        WHERE is_approved = true AND is_active = false 
        AND start_date <= CURRENT_TIMESTAMP AND end_date >= CURRENT_TIMESTAMP
        RETURNING id, title
      `);
      if (activeRes.rows.length > 0) {
        console.log(`⏱️  Scheduler: Activated ${activeRes.rows.length} scheduled campaign(s):`);
        activeRes.rows.forEach(c => console.log(`   - [ACTIVATED] ${c.title}`));

        // The frontend now supports multiple active campaigns via a slider. 
        // No need to deactivate overlapping campaigns.
      }

    } catch (error) {
      console.error("⏱️  Scheduler Error:", error.message);
    }
  };

  // Run immediately on launch
  checkCampaigns();

  // Run every 1 minute for responsive, real-time campaign testing and production state changes!
  setInterval(checkCampaigns, 60000);
};
