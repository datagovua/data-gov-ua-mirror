const createDbReader = require('./dbReader');
const createUploader = require('./uploader');


function readOrgs(handleOrg) {
  let reader = createDbReader();
  let errors = [];

  return reader
    .init()
    .then(() => reader.readOrganizations())
    .then(orgsCursor => {
      return orgsCursor.eachAsync((org) => {
        return handleOrg(org)
        .catch((err) => {
          console.log(err);
          errors.push(err);
        });
      })
    })
    .catch((err) => {console.log(err)})
    .then(() => {
      return reader.finish();
    });
}

function orgsUpload() {
  let ckan = createUploader();
  return readOrgs((org) => {
    return ckan.createOrganization(org);
  });
}

module.exports = orgsUpload;

orgsUpload();
