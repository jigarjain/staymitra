'use strict';

var _          = require('lodash');
var Twitter    = require('./libs/twitter');
var EntryModel = require('./models/entries');


function handler() {
    Twitter.getMentions((err, tweets) => {
        if (err) {
            return cb(err);
        }

        var receivedTweetIds = [];

        var entries = tweets.map((t) => {
            var entry = new EntryModel.Entry();

            entry.tweetId = t.id;

            entry.tweet = t.text;

            entry.tweeter = {
                id: t.user.id,
                name: t.user.name,
                screenName: t.user.screen_name
            };

            receivedTweetIds.push(t.id);
            return entry;
        });


        console.log('Total', entries.length);

        EntryModel.Repo.fetchAll((err, allEntries) => {
            var filteredEntries = [];

            if (allEntries.length) {
                console.log('Existing', allEntries.length);
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

            console.log('Inserting', filteredEntries.length);
            if (filteredEntries.length) {
                EntryModel.Repo.save(filteredEntries, (err, data) => {
                    if (err) {
                        throw err;
                    }

                    process.exit(1);
                });
            } else {
                process.exit(1);
            }
        });
    });
}

handler();