const oracledb = require("oracledb");

oracledb.initOracleClient({ libDir: "C:\\oracle\\instantclient\\instantclient_23_0" });
process.env.TNS_ADMIN = "C:\\oracle\\wallet";

async function test() {
  let connection;

  try {
    connection = await oracledb.getConnection({
      user: "ADMIN",
      password: "Apalaci.2030",
      connectString: "ledgera_high",
    });

    const result = await connection.execute(`SELECT 'OK' FROM dual`);
    console.log(result.rows);

  } catch (err) {
    console.error("Error:", err);

  } finally {
    if (connection) await connection.close();
  }
}

test();