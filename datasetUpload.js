const createDbReader = require('./dbReader');
const createUploader = require('./uploader');
const orgsUpload = require('./orgUpload');

function readDatasets(handle) {
  return read(handle, 'readDatasets');
}

function readRevisions(handle) {
  return read(handle, 'readMetadata');
}

function read(handle, methodName) {
  let reader = createDbReader();
  let errors = [];

  return reader
    .init()
    .then(() => reader[methodName]())
    .then(cursor => {
      return cursor.eachAsync((item) => {
        return handle(item)
        .catch((err) => {
          errors.push(err);
          console.log(err);
        });
      })
    })
    .catch((err) => {console.log(err)})
    .then(() => {
      return reader.finish();
    });
}

function datasetsUpload() {
  let ckan = createUploader();
  return readDatasets((revision) => {
    return ckan.createDataset(revision);
  })
  .then(() => {
    return readRevisions(revision => {
      return ckan.createResource(revision);
    });
  });
}

module.exports = datasetsUpload;

orgsUpload().then(() => {
  return datasetsUpload();
})
