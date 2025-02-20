const axios = require('axios');
const parser = require('xml2json');
const eyes = require('eyes');
const R = require('ramda');
const fs = require('fs');

let serverUrl = 'http://127.0.0.1:2203';

module.exports = {
  getProjects: async (format = 'json') => {
    return axios
      .get(serverUrl + '/projects?from=today', {
        headers: {
          Accept: 'application/' + format,
        },
      })
      .then((response) => {
        console.log('todo response:');
        eyes.inspect(response.data);
        if (format.endsWith('xml')) {
          const result = JSON.parse(parser.toJson(response.data));
          console.dir(result, { depth: 10 });
          return R.path(['ns1:projects'], result);
        }
        return response.data;
      })
      .catch((error) => {
        console.log('todo error', error.message);
        return Promise.reject(error);
      });
  },
  setUrl: function (url) {
    serverUrl = url;
    return this;
  },
  postImage: (id, image) => {
    const data = fs.readFileSync(image);
    return axios.post(serverUrl + '/projects/' + id + '/images', data, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  },
};
