var fs         = require('fs');
var moment     = require('moment');
var async      = require('async');
var base64     = require('node-base64-image'); // ES5
var _          = require('lodash');
var AI         = require('./libs/ai');
var SZ         = require('./libs/sz');
var Twitter    = require('./libs/twitter');
var EntryModel = require('./models/entries');
var ReplyModel = require('./models/replies');


function handler() {
    EntryModel.Repo.fetchPending((err, entries) => {
        if (err) {
            throw err;
        }

        // If no pending, then stop
        if (!entries.length) {
            process.exit(1);
        }

        entries = entries.map((e) => {
            e.status = 'processing';
            return e;
        });

        async.map(entries,
            (e, cb) => {
                EntryModel.Repo.update(e, (err) => {
                    if (err) {
                        return cb(err);
                    }

                    cb(null, true);
                });
            },
            (err, data) => {
                if (err) {
                    throw err;
                }

                async.map(entries, processTweet, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    process.exit(1);
                });
            }
        );
    });
}


function processTweet(entry, cb) {
    AI.process(entry.tweet, (err, params) => {
        if (err) {
            return cb(null, {
                success: false,
                query: {
                    entry: entry
                }
            });
        }

        var stayQuery = {};
        stayQuery.entry = entry;

        // Process the city name
        if (!params['geo-city']) {
            return cb(null, {
                success: false,
                query: stayQuery
            });
        }

        stayQuery.city = params['geo-city'];

        // Process the stay type
        stayQuery.stayType = params['stay-type'] || 'homestay';


        var dates = getCheckinCheckout(params['date']);

        stayQuery.checkInDate = dates.checkInDate;
        stayQuery.checkOutDate = dates.checkOutDate;

        // Make SZ API call
        SZ.search(stayQuery, (err, stays) => {
            if (err) {
                return cb(null, {
                    success: false,
                    query: stayQuery
                });
            }

            stays = extractStayData(stays);

            var images = {};

            stays.forEach((s) => {
                var imgs = s.images.splice(0, 3);
                images[s.sz_id] = imgs.map((i) => {
                    return `https://stay-imgs.stayzilla.com/resize/800x400/${s.sz_id}/${i.sz_id}.${i.ext}`
                });
            });

            // Read the images
            async.map(images, getImageBinary, (err, binaries) => {
                binaries.forEach((imageBinaries, key) => {
                    stays[key].images = _.compact(imageBinaries);
                });

                postTweet(stays, stayQuery, (err, data) => {
                    if (err) {
                        return cb(null, {
                            success: false,
                            query: stayQuery,
                            stays: stays
                        });
                    }

                    cb(null, {
                        success: true,
                        query: stayQuery,
                        stays: stays,
                        response: data
                    });
                });
            });
        });
    });
}

function getCheckinCheckout(checkIn, checkOut) {
    var defaultCheckin = new Date(new Date().setDate(new Date().getDate() + 2));

    checkIn = checkIn ? new Date(checkIn) : defaultCheckin,

    checkOut = new Date(checkIn);
    checkOut = new Date(checkOut.setDate(checkIn.getDate() + 3));

    return {
        checkInDate: moment(checkIn).format('YYYY-MM-DD'),
        checkOutDate: moment(checkOut).format('YYYY-MM-DD'),
    }
}

function extractStayData(stays) {
    return stays.map(function(s) {
        return {
            sz_id: s.sz_id,
            name: s.name,
            type: s.category,
            //contact: s.contact,
            url: `https://stayzilla.com${s.url}`,
            images: s.images
        }
    });
}


function getImageBinary(images, callback) {
    async.map(images,
        (url, cb) => {
            var options = {string: true};
            base64.encode(url, options, function (err, image) {
                if (err) {
                    return cb(null, null);
                }

                return cb(null, image);
            });
        },
        (err, binaries) => {
            if (err) {
                return callback(err);
            }

            callback(null, binaries);
        }
    );
}


function postTweet(stays, stayQuery, cb) {
    var tweet;
    var name = stayQuery.entry.tweeter.name ? stayQuery.entry.tweeter.name.split(' ')[0] : '';
    var city = stayQuery.city;
    var handle = `@${stayQuery.entry.tweeter.screenName}`;

    EntryModel.Repo.updateStatus(stayQuery.entry.tweetId, 'processing', (err) => {
        if (err) {
            console.log('Error', err);
            return cb(err);
        }

        async.eachOfSeries(stays, function (stay, i, cb) {
            var stayName = stay.name;
            var stayLink = stay.url;
            var options = {
                replyId: stayQuery.entry.tweetId
            };

            switch(i) {
                case 0:
                    tweet = `Hi ${handle}, You asked for stays in ${city}. Here you go! Check out - ${stayName} ${stayLink}`
                    break;

                case 1:
                    tweet = `${handle} You might also want to check this awesome stay in ${city}. ${stayName} ${stayLink}`;
                    break;

                case 2:
                    tweet = `Hey ${handle}, I just found you one more in ${city}. ${stayName} ${stayLink}`;
                    break;

                default:
                    tweet = `Hi ${handle}, You asked for stays in ${city}. Here you go! Check out - ${stayName} ${stayLink}`
                    break;
            }


            Twitter.update(tweet, stay.images, stayQuery.entry.tweetId, (err, postedTweet, data) => {
                try {
                    var reply = new Reply();
                    reply.tweetId = postedTweet.id_str;
                    reply.replyToTweetId = stayQuery.entry.tweetId;
                    reply.repliedToUser = stayQuery.entry.tweeter;
                    reply.stayQuery = stayQuery;
                    reply.stay = stay;
                }
                cb(null, postedTweet);
            });
        });

    },
    (err, data) => {
        if (err) {
            return cb(err);
        }

        return cb(null, data);
    });
}

handler();
