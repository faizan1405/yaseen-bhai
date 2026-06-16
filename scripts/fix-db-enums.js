const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://faizankhan1405_db_user:faizankhan1405_db_user@shadi-mubarak-cluster.ydid5wn.mongodb.net/shadi_mubarak?retryWrites=true&w=majority&appName=shadi-mubarak-cluster";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db('shadi_mubarak');
    
    // 1. Inspect PackagePurchase collection
    const purchasesCol = db.collection('PackagePurchase');
    const allPurchases = await purchasesCol.find({}).toArray();
    console.log(`Found ${allPurchases.length} total purchases in DB.`);
    
    for (const p of allPurchases) {
      let updatedType = null;
      if (p.packageType === 'HIGH_PROFILE') {
        updatedType = 'high_profile_package';
      } else if (p.packageType === 'GOOD_PROFILE') {
        updatedType = 'good_profile_package';
      } else if (p.packageType === 'SECOND_MARRIAGE') {
        updatedType = 'second_marriage_package';
      } else if (p.packageType === 'MONTHLY' || p.packageType === 'STANDARD') {
        updatedType = 'monthly_membership';
      } else if (p.packageType === 'CURATED') {
        updatedType = 'good_profile_package';
      }
      
      if (updatedType) {
        await purchasesCol.updateOne({ _id: p._id }, { $set: { packageType: updatedType } });
        console.log(`Updated purchase ${p._id} packageType from "${p.packageType}" to "${updatedType}"`);
      }
    }
    
    console.log("Database enums cleanup finished successfully.");
  } catch (error) {
    console.error("Error running database repair:", error);
  } finally {
    await client.close();
  }
}

run();
