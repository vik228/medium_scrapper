var fs = require('fs');
var q = require('q');
exports.generateCSV = function(filename, data) {
    var defer = q.defer();
    var stream = fs.createWriteStream(filename);
    stream.once('open', function() {
        stream.write('Link , Text\n');
        data.forEach(function(item, idx) {
            var str = item['link'] + "," + item['text'] + "\n";
            stream.write(str);
        });
        stream.end();
        stream.on('finish', function() {
            defer.resolve();
        });
        stream.on('error', function(err) {
            defer.reject(err);
        });
    });
    return defer.promise;
}
