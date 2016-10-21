var cfg     = require('../config');
var mongojs = require('mongojs');
var _       = require('lodash');
var db      = mongojs(cfg.mongo.db);
var coll    = db.collection('replies')


function Reply() {
    this._id = null;

    this.tweetId = null

    this.tweet = null;

    this.replyToTweetId = null;

    this.repliedToUser = {
        id: null,
        name: null,
        screenName: null
    };

    this.stayQuery = null;

    this.stay = null;
};

function Repo () {};


Repo.save = function (reply) {
    return new Promise(function (resolve, reject) {
        coll.insert(reply, function (err) {
            if (err) {
                return reject(err);
            }

            resolve();
        });
    });
};


Repo.getByTweetId = function (tweetId) {
    return new Promise(function (resolve, reject) {
        coll.findOne({
            'tweetId': tweetId
        }, (err, doc) => {
            if (err) {
               return reject(err);
            }

            return resolve(null, doc ? _.create(new Reply(), doc) : null);
        });
    });
};


Repo.getByRepliedToId = function (replyToTweetId) {
    return new Promise(function (resolve, reject) {
        coll.findOne({
            'replyToTweetId': replyToTweetId
        }, (err, doc) => {
            if (err) {
               return reject(err);
            }

            return resolve(null, doc ? _.create(new Reply(), doc) : null);
        });
    });
};


Repo.fetchAll = function () {
    return new Promise(function (resolve, reject) {
        coll.find((err, docs) => {
            if (err) {
               return reject(err);
            }

            docs = docs.map((d) => {
                return _.create(new Reply, d);
            });

            return resolve(docs);
        });
    });
}


module.exports = {
    Reply: Reply,
    Repo: Repo
};