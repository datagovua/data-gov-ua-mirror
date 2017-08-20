const CKAN = require('ckan');


function errorGroupExists(error) {
  return (error &&
          error.__type === 'Validation Error' &&
          error.name &&
          error.name[0] === 'Group name already exists in database');
}

function errorUrlExists(error) {
  return (error &&
          error.__type === 'Validation Error' &&
          error.name &&
          error.name[0] === 'That URL is already in use.');
}

module.exports = function createUploader() {

  const apiToken = process.env.CKAN_API_TOKEN;
  
  const client = new CKAN.Client(
    process.env.CKAN_URL + '/en',
    apiToken
  );

  function parseDate(stringDate) {
    const match = stringDate.match(/(\d\d)\.(\d\d)\.(\d\d\d\d)\ (\d\d):(\d\d)/);
    const day = match[1];
    const month = match[2];
    const year = match[3];
    const hh = match[4];
    const mm = match[5];
    return year + '-' + month + '-' + day + ' ' + hh + ':' + mm;//new Date(year, month, day, hh, mm);//.toISOString();
  }

  return {
    createResource(revision) {
      return new Promise(function(resolve, reject) {
        let data = {
          package_id: 'data-gov-ua-node-' + revision.dataset_node_id,
          url: revision.base_url + revision.url,
          revision_id: 'data-gov-ua-revision-' + revision.revision_id,
          id: 'data-gov-ua-revision-' + revision.revision_id,
          description: revision.description,
          name: revision.revision_created + ' ' + (revision.title || revision.description),
          mimetype: revision.filemime,
          size: revision.filesize,
          created: parseDate(revision.revision_created),
        };
        client.action('resource_show', { id: data.id }, function(err, result) {
          if(result.error && result.error.message === 'Not found') {
            console.log('creating ' + revision.revision_id);
            client.action('resource_create', data, function(err, result) {
              if(errorUrlExists(result.error)) {
                console.log(data.id + ' already exists, updating');
                client.action('resource_update', data, function(err, result) {
                  if(err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              } else {
                if(result.error) {
                  reject(result.error)
                } else {
                  resolve();
                }
              }
            });
          } else {
            console.log(revision.revision_id + ' already exists, skipping');
            resolve();
          }
        });
      });
    },

    createDataset(revision) {
      return new Promise(function(resolve, reject) {
        let data = {
          name: 'data-gov-ua-node-' + revision.dataset_node_id,
          title: revision.title || revision.description,
          maintainer: revision.responsible_person.name,
          maintainer_email: revision.responsible_person.email,
          owner_org: 'data-gov-ua-' + revision.organization_id,
          state: 'active',
        };
        client.action('package_create', data, function(err, result) {
          if(errorUrlExists(result.error)) {
            console.log(data.name + ' already exists, updating');
            client.action('package_show', { id: data.name }, function(err, result) {
              if(err) {
                reject(err);
              } else {
                data = Object.assign(result.result, data);
                client.action('package_update', data, function(err, result) {
                  if(err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              }
            })
          } else {
            if(result.error) {
              reject(result.error)
            } else {
              resolve();
            }
          }
        });
      });
    },

    createOrganization(org) {
      return new Promise(function(resolve, reject) {
        let data = {
          name: 'data-gov-ua-' + org.organization_id,
          id: 'data-gov-ua-' + org.organization_id,
          title: org.organization_name,
          state: 'active',
          extras: [
            {
              key: 'website',
              value: org.website,
            },
            {
              key: 'address',
              value: org.address,
            },
            {
              key: 'phone',
              value: org.phone,
            },
            {
              key: 'category',
              value: org.category,
            },
          ],
        };
        client.action('organization_create', data, function(err, result) {
          if(errorGroupExists(result.error)) {
            console.log(data.id + ' already exists, updating');
            client.action('organization_update', data, function(err, result) {
              if(err) {
                reject(err);
              } else {
                resolve();
              }
            });
          } else {
            if(result.error) {
              reject(result.error)
            } else {
              resolve();
            }
          }
        });
      });
    }
  
  }
  
}
