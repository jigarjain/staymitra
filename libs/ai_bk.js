'use strict';

const cfg = require('../config');
const request = require('request');

const apiUrl = 'https://api.api.ai/v1/query'

function AI () {};

AI.process = (entry, cb) => {
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
            return cb(err);
        }

        cb(null, JSON.parse(body).result.parameters);
    });
};


module.exports = AI;
