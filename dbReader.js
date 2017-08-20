const r = require('rethinkdb');


module.exports = function() {
  let connection = null;
  const dbName = 'mirror';

  return {
    init() {
      return r
      .connect({host: process.env.RETHINKDB_HOST, port: 28015})
      .then((conn) => {
         connection = conn;
         connection.use(dbName);
       });
    },

    readNodes() {
      return r.table('nodes').orderBy('node_id', {index: 'node_id'}).run(connection);
    },

    readTempRevisions() {
      return r.table('temp_revisions').orderBy({index: 'revision_id'}).run(connection);
    },

    readDatasets() {
      return r.table('datasets').orderBy({index: 'dataset_node_id'}).run(connection);
    },

    readMetadata() {
      return r
        .table("files")
        .orderBy({index:"revision_id"})
        .eqJoin('revision_id', r.table("revisions"),
          {index:'revision_id', ordered: true}
        ).zip().orderBy('revision_id')
        .run(connection);
    },

    readOrganizations() {
      return r.table('organizations').orderBy({index: 'organization_id'}).run(connection);
    },

    finish() {
      return connection.close().then(() => { connection = null; });
    },
  }
};

