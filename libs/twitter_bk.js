'use strict';

const async   = require('async');
const cfg     = require('../config');
const Twitter = require('twitter');
const Twit    = require('twit');

const tw = new Twitter({
    consumer_key: cfg.twitter.consumerKey,
    consumer_secret: cfg.twitter.consumerSecret,
    access_token_key: cfg.twitter.accessToken,
    access_token_secret: cfg.twitter.accessTokenSecret
});

// const t = new Twit({
//     consumer_key: cfg.twitter.consumerKey,
//     consumer_secret: cfg.twitter.consumerSecret,
//     access_token_key: cfg.twitter.accessToken,
//     access_token_secret: cfg.twitter.accessTokenSecret,
//     timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
// });

function TwitterClient () {};


TwitterClient.getTimeline = (cb) => {
    const params = {
        screen_name: cfg.twitter.screenName
    };

    tw.get('statuses/user_timeline', params, (err, tweets, response) => {
        if (err) {
            return cb(err);
        }

        cb(null, tweets);
    });
};


TwitterClient.getMentions = (cb) => {
    const params = {
        screen_name: cfg.twitter.screenName
    };

    tw.get('statuses/mentions_timeline', params, (err, tweets, response) => {
        if (err) {
            return cb(err);
        }

        cb(null, tweets);
    });
};


TwitterClient.upload = (binary, cb) => {
    tw.post('media/upload', {media_data: binary}, function(err, media, response) {
        if (err) {
            return cb(err);
        }


        return cb(null, media);
    });
};


TwitterClient.update = (status, images, replyId, cb) => {
    const params = {
        status: status
    };

    if (replyId) {
        params.in_reply_to_status_id = replyId;
    }

    function postTweet(medias) {
        if (medias.length) {
            params.media_ids = medias.join(',');
        }

        return cb(null, params)

        // Posting status update
        tw.post('statuses/update', params, (err, tweet, resp) => {
            if (err) {
                console.log('Error while posting status', err);
                //console.log(resp);
                return cb(err, null);
            }

            return cb(null, tweet);
        });
    }


    if (images && images.length) {
        async.map(images, (img, cb) => {
            TwitterClient.upload(img, (err, media) => {
                console.log('received media', media.media_id_string);
                cb(null, media.media_id_string);
            });
        },
        (err, data) => {
            if (err) {
                return cb([]);
            }

            console.log(data);
            postTweet(data);
        });
    } else {
        postTweet();
    }
}

module.exports = TwitterClient;