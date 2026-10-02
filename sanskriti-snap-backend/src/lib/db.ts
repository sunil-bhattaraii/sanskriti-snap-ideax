/**
 * MongoDB connection and transaction helper.
 *
 * A successful discovery touches seven collections at once (attempt, discovery,
 * xpTransactions, pointsTransactions, user counters, quest progress, badges).
 * Partial reward state is worse than no reward state, so all of it runs in one
 * transaction (docs/DB Schemas.md 26, docs/Backend TDS.md 78).
 *
 * MongoDB transactions require a replica set. Atlas SRV clusters are replica
 * sets, so this works in staging and production; a standalone local mongod does
 * not support it and will throw at the first write.
 */

import mongoose, { type ClientSession, type Connection } from "mongoose";
import { env } from "./env";

// Reuse the connection across Next.js hot reloads in development, otherwise
// every route edit opens a new pool and Atlas rate-limits us.
const globalForMongoose = globalThis as unknown as {
  __mongooseConn?: Promise<Connection>;
};

/** Upper bound on a whole transaction. Our callbacks are pure DB writes, so
 * anything approaching this means a bug, not a slow query. */
const DEFAULT_TRANSACTION_TIMEOUT_MS = 5_000;

export function connect(): Promise<Connection> {
  if (!globalForMongoose.__mongooseConn) {
    mongoose.set("strictQuery", true);
    globalForMongoose.__mongooseConn = mongoose
      .connect(env().MONGODB_URI, {
        bufferCommands: false,
        maxPoolSize: 10,
      })
      .then((m) => m.connection)
      .catch((error: unknown) => {
        // Clear the cache so a transient outage (Atlas failover, laptop on a
        // train) does not pin a rejected promise for the process lifetime.
        // Safe to write unconditionally: while this promise is pending it is
        // the cached value, so no other promise can have replaced it.
        globalForMongoose.__mongooseConn = undefined;
        throw error;
      });
  }
  return globalForMongoose.__mongooseConn;
}

/** Derived from the driver so it stays correct across mongodb upgrades.
 * Hand-writing this loses `timeoutMS` and the rest of `TransactionOptions`. */
export type SessionOptions = NonNullable<
  Parameters<ClientSession["withTransaction"]>[1]
>;

/**
 * Runs `fn` inside a transaction, committing on success and aborting on any
 * throw.
 *
 * Three constraints from the driver's `withTransaction` contract that are easy
 * to get wrong and expensive to debug in production:
 *
 * 1. `fn` MAY BE CALLED MORE THAN ONCE. The driver retries on transient
 *    transaction errors, so it must be idempotent and contain no side effects
 *    outside MongoDB — no Cloudinary upload, no fetch, no counter held in
 *    memory. Put all of that before the transaction (docs/Backend TDS.md 78).
 * 2. NEVER swallow an error inside `fn`. If the callback catches a failed
 *    command and returns normally, the driver cannot tell the transaction was
 *    aborted, and retries it indefinitely — the request hangs instead of
 *    erroring. Let rejections propagate, even for "best effort" writes.
 * 3. Do not parallelize with `Promise.all`/`Promise.race` inside the callback;
 *    the driver documents that as undefined behaviour. Sequential awaits only.
 *
 * Pass the same `session` to every operation that must commit or roll back
 * together. An operation without it runs outside the transaction and survives
 * the abort, which is how you end up with XP awarded against no discovery.
 */
export async function withTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  options?: SessionOptions,
): Promise<T> {
  const conn = await connect();
  const session = await conn.startSession();
  try {
    return await session.withTransaction(() => fn(session), {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
      readPreference: "primary",
      timeoutMS: DEFAULT_TRANSACTION_TIMEOUT_MS,
      ...options,
    });
  } finally {
    await session.endSession();
  }
}

export { mongoose };
export type { ClientSession };
