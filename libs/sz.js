var request = require('request');
var searchUrl = 'https://search.stayzilla.com/v1/json/postsearchsimple'

function SZ () {};


SZ.search = function (query) {
    return new Promise(function (resolve, reject) {
        var params = {
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
                return reject(err);
            }

            try {
                var results = JSON.parse(body).data.results;
            } catch (err) {
                results = [];
            }

            resolve(results);
        });
    });
};


module.exports = SZ;
