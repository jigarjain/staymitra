var async   = require('async');
var cfg     = require('../config');
var Twitter = require('twitter');
var Twit    = require('twit');

var tw = new Twitter({
    consumer_key: cfg.twitter.consumerKey,
    consumer_secret: cfg.twitter.consumerSecret,
    access_token_key: cfg.twitter.accessToken,
    access_token_secret: cfg.twitter.accessTokenSecret
});

function TwitterClient () {};


TwitterClient.getMentions = function () {
    return new Promise(function (resolve, reject) {
        var params = {
            screen_name: cfg.twitter.screenName
        };

        tw.get('statuses/mentions_timeline', params, (err, tweets, response) => {
            if (err) {
                return reject(err);
            }

            resolve(tweets);
        });
    });
};


TwitterClient.upload = function (binary) {
    return new Promise(function (resolve, reject) {
        tw.post('media/upload', {media_data: binary}, function(err, media, response) {
            if (err) {
                return resolve(null);
            }


            return resolve(media);
        });
    });
};


TwitterClient.update = function (status, replyId, medias) {
    return new Promise(function (resolve, reject) {
        var params = {
            status: status
        };

        if (replyId) {
            params.in_reply_to_status_id = replyId;
        }

        if (medias && medias.length) {
            params.media_ids = medias.join(',');
        }

        // Posting status update
        tw.post('statuses/update', params, (err, tweet, resp) => {
            if (err) {
                return resolve(err);
            }

            return resolve(JSON.parse(resp.body));
        });
    });
}

module.exports = TwitterClient;