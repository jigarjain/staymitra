'use strict';

var co         = require('co');
var _          = require('lodash');
var Twitter    = require('./libs/twitter');
var EntryModel = require('./models/entries');


var handler = function* () {
    var tweets = yield Twitter.getMentions();

    var receivedTweetIds = [];

    var entries = tweets.map((t) => {
        var entry = new EntryModel.Entry();

        entry.tweetId = t.id_str;

        entry.tweet = t.text;

        entry.tweeter = {
            id: t.user.id_str,
            name: t.user.name,
            screenName: t.user.screen_name
        };

        receivedTweetIds.push(t.id_str);
        return entry;
    });


    console.log('Received Tweets', entries.length);

    var allEntries = yield EntryModel.Repo.fetchAll();
    var filteredEntries = [];

    if (allEntries.length) {
        console.log('Existing Tweets', allEntries.length);
        _.each(entries, function (e) {
            var alreadyExists = false;

            _.each(allEntries, function (ae) {
                if (e.tweetId === ae.tweetId) {
                    alreadyExists = true;
                    return false;
                }
            });

            if (!alreadyExists) {
                filteredEntries.push(e);
            }
        });
    } else {
        filteredEntries = entries;
    }

    console.log('Inserting Tweets', filteredEntries.length);

    if (filteredEntries.length) {
        yield EntryModel.Repo.save(filteredEntries);
    }

    console.log('Done');
    console.log('\n\n');
};

var start = function () {
    co(handler).catch(function (err) {
        console.log(err);
    });
}

setInterval(start, 60000);

start();