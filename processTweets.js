var co         = require('co');
var moment     = require('moment');
var base64     = require('node-base64-image'); // ES5
var _          = require('lodash');
var AI         = require('./libs/ai');
var SZ         = require('./libs/sz');
var Twitter    = require('./libs/twitter');
var EntryModel = require('./models/entries');
var ReplyModel = require('./models/replies');


var handler = function* () {
    var entries = yield EntryModel.Repo.fetchPending();

    if (!entries.length) {
        console.log('Nothing to process');
        return;
    }

    console.log('Processing tweets:', entries.length);
    var results = yield entries.map(processTweet);
    console.log('Successfully Processed', _.compact(results));
    console.log('\n\n');
}


function* processTweet(entry) {
    var params = yield AI.process(entry.tweet.replace('@', ''));

    console.log('Got params from AI for tweet', entry.tweet, params);

    if (!params) {
        yield processFailureTweet(entry);
        return false;
    }

    var stayQuery = {};
    stayQuery.entry = entry;

    var stayCity = params['geo-city'] || params['hcity'];

    // Process the city name
    if (!stayCity) {
        yield processFailureTweet(entry);
        return false;
    }

    stayQuery.city = stayCity;

    // Process the stay type
    stayQuery.stayType = params['stay-type'] || 'homestay';

    var checkIn, checkOut;

    if (params['date']) {
        checkIn = params['date'];
    }

    if (params['date-period']) {
        var temp = params['date-period'].split('/');
        if (temp.length == 2) {
            checkIn = temp[0];
            checkOut = temp[1];
        }
    }

    var dates = getCheckinCheckout(checkIn, checkOut);

    stayQuery.checkInDate = dates.checkInDate;
    stayQuery.checkOutDate = dates.checkOutDate;


    var stays = yield SZ.search(stayQuery);

    console.log('Got stays for dates', stayQuery.checkInDate, stayQuery.checkOutDate, 'for tweet', entry.tweet, stays.length);

    if (!stays.length) {
        yield processFailureTweet(entry);
        return false;
    }

    stays = extractStayData(stays);

    return yield postTweet(stays, stayQuery);
};



function getCheckinCheckout(checkIn, checkOut) {
    var defaultCheckin = new Date(new Date().setDate(new Date().getDate() + 2));

    checkIn = checkIn ? new Date(checkIn) : defaultCheckin;

    if (checkOut) {
        checkOut = new Date(checkOut);
    } else {
        checkOut = new Date(checkIn);
        checkOut = new Date(checkOut.setDate(checkIn.getDate() + 3));
    }

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
            url: `https://stayzilla.com${s.url}`,
            images: s.images.splice(0, 3)
        }
    });
}


function getImageBinary(imgUrl) {
    return new Promise(function (resolve, reject) {
        var options = {string: true};
        base64.encode(imgUrl, options, function (err, image) {
            if (err) {
                return resolve(null);
            }

            return resolve(image);
        });
    });
}


function* postTweet(stays, stayQuery) {
    var city = stayQuery.city;
    var handle = `@${stayQuery.entry.tweeter.screenName}`;

    yield EntryModel.Repo.updateStatus(stayQuery.entry.tweetId, 'processing');

    function* processStay(stay, i) {
        var tweet;
        var stayName = stay.name.substring(0, 20);
        var stayLink = `${stay.url}?checkInDate=${stayQuery.checkInDate}&checkOutDate=${stayQuery.checkOutDate}`;
        var medias = [];

        switch(i) {
            case 0:
                tweet = `${handle} Hi, You asked for stays in ${city}. Here you go! Check out - ${stayName} ${stayLink}`
                break;

            case 1:
                tweet = `${handle} You might also want to check this awesome stay in ${city}. ${stayName} ${stayLink}`;
                break;

            case 2:
                tweet = `${handle} Hey, I just found you one more in ${city}. ${stayName} ${stayLink}`;
                break;

            default:
                tweet = `${handle}, You asked for stays in ${city}. Here you go! Check out - ${stayName} ${stayLink}`
                break;
        }

        var imageUrls = stay.images.map(function (i) {
            return `https://stay-imgs.stayzilla.com/resize/800x400/${stay.sz_id}/${i.sz_id}.${i.ext}`;
        });

        stay.images = yield imageUrls.map(getImageBinary);

        if (stay.images && stay.images.length) {
            medias = yield stay.images.map(Twitter.upload);
            medias = _.compact(medias.map(function (m) {
                if (m) {
                    return m.media_id_string;
                }
            }));
        }

        var response = yield Twitter.update(tweet, stayQuery.entry.tweetId, medias);
        console.log(response.text);
    }

    var i = 0;

    for (i = 0; i < stays.length; i++) {
        yield processStay(stays[i], i);
    }

    return true;
}


function* processFailureTweet(entry) {
    yield EntryModel.Repo.updateStatus(entry.tweetId, 'processing');

    var handle = `@${entry.tweeter.screenName}`;
    var tweet = `${handle} Sorry, I couldn't understand you as I am still new & learning things. Why don't you try here -> https://www.stayzilla.com`
    console.log(tweet);
    var response = yield Twitter.update(tweet, entry.tweetId);

    console.log(response.text);
}


var start = function () {
    co(handler).catch(function (err) {
        console.log(err);
    });
}

setInterval(start, 30000);

start();

