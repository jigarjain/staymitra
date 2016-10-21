var cfg     = require('../config');
var request = require('request');

var apiUrl  = 'https://api.api.ai/v1/query'

function AI () {};

AI.process = function (entry) {
    return new Promise(function (resolve, reject) {
        request.get({
            url: apiUrl,
            headers: {
                'Authorization': 'Bearer ' + cfg.aiApiKey,
            },
            qs: {
                query: entry,
                lang: 'en'
            }
        }, function (err, httpResponse, body) {
            if (err) {
                return reject(err);
            }

            console.log(JSON.parse(body));
            resolve(JSON.parse(body).result.parameters);
        });
    });
};


module.exports = AI;
