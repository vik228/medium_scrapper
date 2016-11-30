'use strict'
var request = require('request');
var cheerio = require('cheerio');
var q = require('q');
q.map = require('q-map').map;
var _string = require('lodash/string');

var currentUrls = []; //holds the number of pages to be scrapped.Max entries will be equal to {maxPagesToCrawl}
var executedUrls = {}; //keeps track of all the visited urls
var hyperlinks = []; //stores all the hyperlinks and their texts
var pagesRemaining = 0; // Number of links to be traversed in the next bulk request

/**
 * formats the url that starts with //:medium.com to http://medium.com/
 * @param url url to format
 * @return {string}
 */
var formatUrl = function(url) {
    if (!url)
        return null;
    var httpPrefixedUrl = url.startsWith('//') ? 'https:' + url : url;
    var hashRemovedUrl = httpPrefixedUrl.split('#')[0];
    return _string.trimEnd(hashRemovedUrl, '/');
}

/**
 * finds all the links within a given html
 * @param html
 * @return {void}
 */
var findAllLinks = function(html) {
    var $ = cheerio.load(html);
    var links = $('a');
    $(links).each(function(i, link) {
        var url = formatUrl($(link).attr('href'));
        var text = $(link).text();
        if (url && url.startsWith('https://medium.com/')) {
            if (pagesRemaining > 0) {
                currentUrls.push(url);
                pagesRemaining--;
            }
            if (!executedUrls[url]) {
                hyperlinks.push({
                    link: url,
                    text: text
                });
            }
        }

    });
}

/**
 * sends the request to medium.com
 * @param url url to be requested
 * @return {promise}
 */
var processRequest = function(url) {
    var defer = q.defer();
    if (executedUrls[url]) {
        defer.resolve([]);
    } else {
        request(url, function(err, response, html) {
            if (!err) {
                executedUrls[url] = true;
                findAllLinks(html);
            }
            defer.resolve();
        });
    }
    return defer.promise;
}

/**
 * preforms the bulk request and ensures that there are only {maxNumRequest} at given time.
 * @param maxNumRequest maximum number of requests to be executed at a time
 * @param callback callback to return when the request finishes
 * @return {void}
 */
var processBulkRequest = function(maxNumRequest, callback) {
    (function performBulkOperation() {
        var currentChunk = [];
        currentChunk = currentUrls.splice(0, currentUrls.length);
        var allPromise = q.map(currentChunk, processRequest, maxNumRequest);
        allPromise.then(function() {
            if (currentUrls.length > 0) {
                setTimeout(performBulkOperation, 0);
            } else {
                callback()
            }

        });
    })();
}

exports.crawl = function(maxNumRequest, maxPagesToCrawl) {
    pagesRemaining = maxPagesToCrawl;
    var defer = q.defer();
    hyperlinks.push({
        link: "https://medium.com/",
        text: "Homepage"
    })
    var requestPromise = processRequest("https://medium.com/");
    requestPromise.then(function() {
        processBulkRequest(maxNumRequest, function() {
            defer.resolve(hyperlinks);
        });
    });
    requestPromise.catch(function(err) {
        defer.reject(err);

    });
    return defer.promise;
}
