import { createUserTable } from "../models/userTable.js";
import { createOrderItemTable } from "../models/orderItemsTable.js";
import { createOrdersTable } from "../models/ordersTable.js";
import { createPaymentsTable } from "../models/paymentsTable.js";
import { createProductReviewsTable } from "../models/productReviewsTable.js";
import { createProductsTable } from "../models/productTable.js";
import { createShippingInfoTable } from "../models/shippinginfoTable.js";
import { createSupportChatsTable } from "../models/supportChatsTable.js";
import { createSupportEmailsTable } from "../models/supportEmailsTable.js";
import { createDeliveryAgentsTable } from "../models/deliveryAgentsTable.js";
import { createDeliveryAgentWorkLogsTable } from "../models/deliveryAgentWorkLogsTable.js";
import { createFinesTable } from "../models/finesTable.js";
import { createDeliveryAgentGpsLogsTable } from "../models/deliveryAgentGpsLogsTable.js";
import { createDeliveryAgentOfflineLogsTable } from "../models/deliveryAgentOfflineLogsTable.js";
import { createProductReelsTable } from "../models/productReelsTable.js";
import { createSalesCampaignsTable } from "../models/salesCampaignsTable.js";
import { createBrowsingHistoryTable } from "../models/browsingHistoryTable.js";
import { createOrderReturnsTable } from "../models/orderReturnsTable.js";
import { createDeliveryShiftBookingsTable } from "../models/deliveryShiftBookingsTable.js";
import { createUserAddressesTable } from "../models/userAddressesTable.js";
import database from "../database/db.js";

export const createTables = async () => {
  try {
    await createUserTable();
    await createProductsTable();
    await createProductReelsTable();
    await createProductReviewsTable();
    await createOrdersTable();
    await createOrderItemTable();
    await createShippingInfoTable();
    await createPaymentsTable();
    await createSupportChatsTable();
    await createSupportEmailsTable();
    await createDeliveryAgentsTable();
    await createDeliveryAgentWorkLogsTable();
    await createFinesTable();
    await createDeliveryAgentGpsLogsTable();
    await createDeliveryAgentOfflineLogsTable();
    await createSalesCampaignsTable();
    await createBrowsingHistoryTable();
    await createOrderReturnsTable();
    await createDeliveryShiftBookingsTable();
    await createUserAddressesTable();

    // Create cosine similarity function for visual recommendations
    await database.query(`
      CREATE OR REPLACE FUNCTION cosine_similarity(a real[], b real[])
      RETURNS real AS $$
      DECLARE
          dot_product real := 0;
          norm_a real := 0;
          norm_b real := 0;
          i integer;
      BEGIN
          IF array_length(a, 1) != array_length(b, 1) THEN
              RETURN NULL;
          END IF;
          
          FOR i IN 1..array_length(a, 1) LOOP
              dot_product := dot_product + a[i] * b[i];
              norm_a := norm_a + a[i] * a[i];
              norm_b := norm_b + b[i] * b[i];
          END LOOP;
          
          IF norm_a = 0 OR norm_b = 0 THEN
              RETURN 0;
          END IF;
          
          RETURN dot_product / (sqrt(norm_a) * sqrt(norm_b));
      END;
      $$ LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE;
    `);

    console.log("All Tables and Database Functions Created Successfully.");
  } catch (error) {
    console.error("Error creating tables:", error);
  }
};

