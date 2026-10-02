import mongoose from "mongoose";

process.loadEnvFile(".env");

await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;

for (const name of [
  "artifacts",
  "artifactreferences",
  "adminactions",
  "users",
  "quests",
  "badges",
  "rewards",
  "verificationattempts",
  "discoveries",
  "contributions",
]) {
  const n = await db.collection(name).countDocuments();
  console.log(`${name.padEnd(22)} ${n}`);
}

console.log("\n-- artifacts --");
const arts = await db
  .collection("artifacts")
  .find({})
  .sort({ _id: -1 })
  .limit(10)
  .toArray();
for (const a of arts) {
  console.log(
    String(a._id),
    "|",
    a.slug,
    "|",
    a.status,
    "| story:",
    a.story === undefined ? "(absent)" : JSON.stringify(a.story),
  );
}

console.log("\n-- users --");
const users = await db.collection("users").find({}).toArray();
for (const u of users) {
  console.log(String(u._id), "|", u.username, "|", u.role, "|", u.accountStatus);
}

console.log("\n-- indexes on artifacts --");
console.log(JSON.stringify(await db.collection("artifacts").indexes()));

await mongoose.disconnect();