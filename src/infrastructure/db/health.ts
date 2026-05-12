import { db } from "./client";

export async function checkDatabase() {
  try {
    const result = await db.query("select now() as now");
    return {
      ok: true,
      time: result.rows[0],
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown database error",
    };
  }
}