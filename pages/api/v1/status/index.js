import database from "infra/database.js";
import { InternalServerError } from "infra/errors.js";

async function status(request, response) {
  try {
    const updatedAt = new Date().toISOString();

    const version = await database.query("SHOW server_version;");

    const maxConnections = await database.query(
      "SELECT * FROM pg_settings WHERE name = 'max_connections';",
    );

    const databaseName = process.env.POSTGRES_DB;
    const openedConnections = await database.query({
      text: "SELECT count(*)::int FROM pg_stat_activity WHERE datname = $1;",
      values: [databaseName],
    });

    response.status(200).json({
      updated_at: updatedAt,
      dependencies: {
        database: {
          version: version.rows[0].server_version,
          max_connections: parseInt(maxConnections.rows[0].setting),
          opened_connections: openedConnections.rows[0].count,
        },
      },
    });
  } catch (error) {
    const publicErrorObject = new InternalServerError({
      cause: error,
    });

    console.log("\n Erro dentro do catch do controller:");
    console.error(publicErrorObject);
    response.status(500).json(publicErrorObject);
  }
}
export default status;
