import mongoose from "mongoose";
import { config } from "dotenv";

config({ path: ".env" });

await mongoose.connect(process.env.MONGODB_URI);
const r = await mongoose.connection.db
  .collection("users")
  .updateOne(
    { clerkUserId: "user_3K8kAC72ypXAfCQQTUKAWxNDc41" },
    { $set: { role: "ADMIN" } },
  );
console.log("matched:", r.matchedCount, "modified:", r.modifiedCount);
if (r.matchedCount === 0) {
  console.log("No record found — sign in as admin@user.com at http://localhost:3000/sign-in first, then re-run this script.");
}
await mongoose.disconnect();
