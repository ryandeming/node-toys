const {si, pantsu} = require('nyaapi')
const downloadTorrent = require('./download')
const store = require('./store')
// let query = "Ooyasan wa Shishunki! (01-12) [480p] (Batch))";
let stop = false;
const nyaa = function(query) { 
  si.searchByUser('HorribleSubs', query)
  .then((data) => {
    data.forEach(function(torrent) {
      if(torrent.seeders > 0) {
        if(torrent.name.includes('(Batch)')) {
            if(stop == false) {
            console.log('downloading BATCH: ' + query);
            stop = true;
            downloadTorrent(torrent.links.file).then((results) => {
              store(results[results.length-1]);
            });
          }
        } else {
          if(stop == false) {
            console.log('downloading: ' + torrent.name);
            stop = true;
            downloadTorrent(torrent.links.file).then((results) => {
              console.log(results);
              store(results[results.length-1]);
            });
          }
        }
      }
    });
  })
  .catch((err) => console.log(err));
};
module.exports = nyaa;