'use strict';

const cfg     = require('../config');
const mongojs = require('mongojs');
const _       = require('lodash');
const db      = mongojs(cfg.mongo.db);
const coll    = db.collection('entries')


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


Repo.save = (tweets, cb) => {
    try {
        coll.insert(tweets, cb);
    } catch (err) {
        cb(err);
    }
};


Repo.getByTweetId = (tweetId, cb) => {
    coll.findOne({
        'tweetId': tweetId
    }, (err, doc) => {
        if (err) {
           return cb(err);
        }

        return cb(null, doc ? _.create(new Entry(), doc) : null);
    });
};


Repo.fetchAll = (cb) => {
    coll.find((err, docs) => {
        if (err) {
           return cb(err);
        }

        docs = docs.map((d) => {
            return _.create(new Entry, d);
        });

        return cb(null, docs);
    });
}


Repo.fetchPending = (cb) => {
    coll.find({
        status: 'pending'
    }, (err, docs) => {
        if (err) {
            return cb(err);
        }

        docs = docs.map((d) => {
            return _.create(new Entry, d);
        });

        return cb(null, docs);
    });
}


Repo.update = (entry, cb) => {
    coll.update({
        '_id': entry._id
    }, entry, (err, doc) => {
        if (err) {
            return cb(err);
        }

        cb(null);
    });
}

Repo.updateStatus = (tweetId, status, cb) => {
    coll.update({
        'tweetId': tweetId
    }, {
        '$set': {
            status: status
        }
    }, (err) => {
        if (err) {
            cb(err)
        }

        cb(null);
    });
}


module.exports = {
    Entry: Entry,
    Repo: Repo
};