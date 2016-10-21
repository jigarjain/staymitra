var cfg     = require('../config');
var mongojs = require('mongojs');
var _       = require('lodash');
var db      = mongojs(cfg.mongo.db);
var coll    = db.collection('entries')


function Entry() {
    this._id = null;

    this.tweetId = null

    this.tweet = null;

    this.tweeter = {
        id: null,
        name: null,
        screenName: null
    };

    this.stayQuery = null;

    this.stays = [];

    this.replyCount = 0;

    this.status = 'pending';
};

function Repo () {};


Repo.save = function (tweets) {
    return new Promise(function (resolve, reject) {
        coll.insert(tweets, function (err) {
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

            return resolve(doc ? _.create(new Entry(), doc) : null);
        });
    });
};


Repo.fetchAll = function () {
    return new Promise(function (resolve, reject) {
        coll.find(function (err, docs) {
            if (err) {
               return reject(err);
            }

            docs = docs.map((d) => {
                return _.create(new Entry, d);
            });

            resolve(docs);
        });
    });
}


Repo.fetchPending = function () {
    return new Promise(function (resolve, reject) {
        coll.find({
            status: 'pending'
        }, function (err, docs) {
            if (err) {
                return reject(err);
            }

            docs = docs.map((d) => {
                return _.create(new Entry, d);
            });

            return resolve(docs);
        });
    });
}


Repo.update = function (entry) {
    return new Promise(function (resolve, reject) {
        coll.update({
            '_id': entry._id
        }, entry, function (err, doc) {
            if (err) {
                return reject(err);
            }

            resolve(doc);
        });
    });
}

Repo.updateStatus = function (tweetId, status) {
    return new Promise(function (resolve, reject) {
        coll.update({
            'tweetId': tweetId
        }, {
            '$set': {
                status: status
            }
        }, function (err) {
            if (err) {
                return reject(err)
            }

            resolve(null);
        });
    });
}


module.exports = {
    Entry: Entry,
    Repo: Repo
};