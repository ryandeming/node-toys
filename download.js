var WebTorrent = require('webtorrent')
const fs = require('fs');
const openload = require('node-openload');
var Promise = require("bluebird");

// openload credentials
const ol = openload({
  api_login: process.env.OPENLOAD_LOGIN,
  api_key: process.env.OPENLOAD_KEY,
});

var client = new WebTorrent()
 
const downloadTorrent = function(magnetURI) { 
  return new Promise(function(resolve, reject) {
    client.add(magnetURI, function (torrent) {
      console.log('Client is downloading:', torrent.infoHash)

      // output download shit
      var interval = setInterval(function() {
        console.log("Download Speed: " + torrent.downloadSpeed);
        console.log("Downloaded: " + torrent.downloaded);
        console.log("Remaining: " + torrent.timeRemaining);
        console.log("Peers: " + torrent.numPeers);
      }, 1000);

      
        torrent.on('done', function () {
          // just logging that all files have been downloaded
          console.log('downloaded!');

          // clearing the download progress interval
          clearInterval(interval);     
          let mirrors = [];
          Promise.map(torrent.files, (file) => {

            let temp = file.name;
            temp = temp.replace('[HorribleSubs] ', '')
            temp = temp.replace(' [1080p]', '');
            temp = temp.replace(' [720p]', '');
            temp = temp.replace(' [480p]', '');
            temp = temp.replace('.mkv', '')
            temp = temp.split("-");
    
            // defining the name and episode to be
            let name = '';
            let episode = '';
    
            // some names contain a hyphen, so merge extras
            // episode will always bethe final item in the split
            for(i=0;i<temp.length;i++) {
              if(i < temp.length-1) {
                name += temp[i];
              } else {
                episode = temp[i];
              }
            }

            return uploadMirrors(torrent.path, file.path, name, episode);
          }).then((results) => {
            // this IMMEDIATELY returns the correct expected end length of mirrors
            resolve(results);
            
            /* torrent.files.forEach((file) => {
              fs.unlink(torrent.path + "/" + file.path, function(err){
                if(err) return console.log(err);
                console.log('file deleted successfully');
              });  
            }); */
          }).catch((err) => {
            console.log(err);
          });
        });
      });
        
    });
};

function uploadMirrors(torrent, file, name, episode) {
  return new Promise((resolve, reject) => {
    ol.upload({
      file: torrent + "/" + file,
    }, progress => console.log(`Upload progress: ${(progress.percent * 100).toFixed(2)}%`))
    .then((res) => {
      // push the resulting name, episode, and openload id
      // to an array that will be returned
      resolve({
        name: name,
        episode: episode,
        openload_id: res.id,
      });
    }).catch((err) => {
      reject(err);
    })
  })
}

module.exports = downloadTorrent;