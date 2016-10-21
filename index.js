'use strict';

const fs      = require('fs');
const moment  = require('moment');
const async   = require('async');
const AI      = require('./libs/ai');
const SZ      = require('./libs/sz');
const Twitter = require('./libs/twitter');
const _       = require('lodash');


function process() {
    
}
function getMentions (cb) {
    Twitter.getMentions((err, tweets) => {
        if (err) {
            return cb(err);
        }

        return cb(null, tweets);
    });
}



// fs.readFile('./corpus.txt', 'utf8', (err, data) => {
//     if (err) {
//         throw err;
//     }

//     const corpus = data.split('\n');

//     //getUserTimeline();


//     // Run the sample data through AI. It will be async call,
//     // we do not need to wait for it
//     async.map(corpus, AI.process, (err, data) => {
//         if (err) {
//             console.log(err);
//         }

//         const stayQueries = data.map((res) => {
//             const stayQuery= {};
//             const query = res.result.parameters;

//             // Process the city name
//             if (!query['geo-city']) {
//                 return false;
//             }

//             stayQuery.city = query['geo-city'];

//             // Process the stay type
//             stayQuery.stayType = query['stay-type'] || 'homestay';


//             const dates = getCheckinCheckout(query['date']);

//             stayQuery.checkInDate = dates.checkInDate;
//             stayQuery.checkOutDate = dates.checkOutDate;

//             return stayQuery;
//         });

//         // Get search results
//         async.map(stayQueries, SZ.search, (err, cbData) => {
//             if (err) {
//                 throw err;
//             }

//             const stays = _.flatten(cbData);
//             extractStayData(stays);
//         });
//     });
// });



function extractStayData(stays) {
    const stayData = stays.map(function(s) {
        return {
            name: s.name,
            type: s.category,
            contact: s.contact,
            url: `https://stayzilla.com${s.url}`,
            images: s.images
        }
    });


    //console.log(stayData);
}


function getCheckinCheckout(checkIn, checkOut) {
    const defaultCheckin = new Date(new Date().setDate(new Date().getDate() + 2));

    checkIn = checkIn ? new Date(checkIn) : defaultCheckin,

    checkOut = new Date(new Date().setDate(checkIn.getDate() + 3));

    return {
        checkInDate: moment(checkIn).format('YYYY-MM-DD'),
        checkOutDate: moment(checkOut).format('YYYY-MM-DD'),
    }
}


setTimeout(process, 6000);

