'use strict'
const NUM_REQUESTS = 5;
const MAX_PAGES_TO_CRAWL = 15;
const FILENAME = "hyperlinks.csv";

var crawler = require('./helpers/crawler');
var csvConverter = require('./helpers/CSVConverter');
var crawlerPromise = crawler.crawl(NUM_REQUESTS, MAX_PAGES_TO_CRAWL);
crawlerPromise.then(function(hyperlinks) {
    csvConverter.generateCSV(FILENAME, hyperlinks).then(function() {
        console.log("csv generated");
    }).catch(function(err) {
        console.log("Error generating csv");

    });
});
crawlerPromise.catch (function (err){
  console.log ("Error Requesting medium.com");

});
