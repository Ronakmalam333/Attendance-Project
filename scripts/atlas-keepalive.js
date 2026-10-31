const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing");
}

async function keepAlive() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("MongoDB Atlas is reachable!");
  } catch (error) {
    console.error("MongoDB Atlas connection failed:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

keepAlive();

