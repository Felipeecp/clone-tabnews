import database from "../../../../infra/database";

async function status(request, response) {
  const updatedAt = new Date().toISOString();
  const databaseName = process.env.POSTGRES_DB;
  const pgVersionQuery = await database.query("SHOW server_version;");
  const pgMaxConnQuery = await database.query("SHOW max_connections;");
  const pgUsedConnQuery = await database.query({
    text: `SELECT * FROM pg_stat_activity WHERE datname = $1;`,
    values: [databaseName],
  });

  console.log(`Banco de dados selecionado: ${databaseName}`);
  const pgUsedConnValue = pgUsedConnQuery.rowCount;
  const pgMaxConnValue = pgMaxConnQuery.rows[0].max_connections;
  const pgVersionValue = pgVersionQuery.rows[0].server_version;

  response.status(200).json({
    updated_at: updatedAt,
    dependencies: {
      database: {
        version: pgVersionValue,
        max_connections: parseInt(pgMaxConnValue),
        opened_connection: pgUsedConnValue,
      },
    },
  });
}

export default status;
