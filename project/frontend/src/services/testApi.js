// src/services/testApi.js (temporary)
import { menuApi } from "./menuApi";

async function testApi() {
  console.log("🧪 Testing Menu API...");

  try {
    // Test 1: Get all items
    console.log("Test 1: Fetching all items...");
    const allItems = await menuApi.getAll();
    console.log(`✅ Got ${allItems.length} items`);

    // Test 2: Get by category
    console.log("Test 2: Fetching appetizers...");
    const appetizers = await menuApi.getByCategory("appetizer");
    console.log(`✅ Got ${appetizers.length} appetizers`);

    // Test 3: Get single item
    if (allItems.length > 0) {
      console.log("Test 3: Fetching single item...");
      const singleItem = await menuApi.getById(allItems[0].id);
      console.log("✅ Got item:", singleItem.name);
    }

    console.log("🎉 All API tests passed!");
  } catch (error) {
    console.error("❌ API Test failed:", error);
  }
}

// Run test
testApi();
