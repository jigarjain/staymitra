'use strict';

const request = require('request');

const searchUrl = 'https://search.stayzilla.com/v1/json/postsearchsimple'

function SZ () {};


SZ.search = (query, cb) => {
    const params = {
        filters: {
            stay: [query.stayType]
        },
        query: {
            type: 'szcity',
            dist: '30km',
            queryText: query.city,
            checkInDate: query.checkInDate,
            checkOutDate: query.checkOutDate
        }
    };

    request.post({
        url: searchUrl,
        form: JSON.stringify(params)
    }, function (err, httpResponse, body) {
        if (err) {
            return cb(err);
        }

        let results = JSON.parse(body).data.results;

        if (results && results.length) {
            results = results.splice(0, 3);
        } else {
            results = [];
        }

        cb(null, results);
    });
};


module.exports = SZ;
