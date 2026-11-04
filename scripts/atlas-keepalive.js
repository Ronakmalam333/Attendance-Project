const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing");
}

async function keepAlive() {
  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    maxPoolSize: 1,
  });

  try {
    await client.connect();

    const result = await client.db("admin").command({ ping: 1 });

    if (result.ok !== 1) {
      throw new Error("MongoDB ping unsuccessful");
    }

    console.log("MongoDB Atlas is reachable!");
    console.log(`Last successful ping: ${new Date().toISOString()}`);
  } catch (error) {
    console.error("MongoDB Atlas connection failed:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

keepAlive().catch(() => {
  process.exitCode = 1;
});
