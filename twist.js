require('events').defaultMaxListeners = 15;
const puppeteer = require('puppeteer');
const $ = require('cheerio');
const openload = require('node-openload');
var Promise = require("bluebird");
var mysql = require('mysql');

//mysql database
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "animewebsite"
});

//openload creds
const ol = openload({
  api_login: process.env.OPENLOAD_LOGIN,
  api_key: process.env.OPENLOAD_KEY,
});

//scape requirements
const url = 'https://twist.moe';
let slug = null;
let startep = null;
let endep = null;

process.argv.forEach(function (val, index) {
  if(index == 2) {
    slug = val;
  }
  if(index == 3) {
    startep = val;
  }
  if(index == 4) {
    endep = val;
  }
});

if(slug == null || startep == null || endep == null) {
  console.log('missing arguments');
  process.exit();
}

// arrays for promise maps
let urls = [];
let episodes = [];
let mirrors = [];

//loop to set up base arrays (urls, episodes)
for(i = startep; i <= endep; i++) {
  urls.push(url + '/a/' + slug + '/' + i);
  episodes.push({
    slug: slug,
    episode: i,
    openload_file_id: null,
  });
}


// the big dick promise function
Promise.map(urls, (url) => {
  return getMirrors(url)
}, {concurrency: 5}).then((results) => {
  results.forEach((result) =>{
    mirrors.push(url + result);
  });
  Promise.map(mirrors, (mirror) => {
    mirror = mirror.replace(/ /g, '%20');
    return remoteMirrors(mirror);
  }, {concurrency: 1}).then((results) => {
    for(i=0;i<results.length;i++) {
      episodes[i].openload_file_id = results[i];
    }
    return results;
  }).then(() => {
    store(episodes);
  })
});

// Stores in the database and exits the process.
const store = function(episodes) {
  let inserts = [];
  episodes.forEach((episode) => {
    inserts.push([episode.openload_file_id, episode.slug, episode.episode]);
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "INSERT INTO openload_remote (openload_file_id, series_slug, episode) VALUES ?";
    con.query(sql, [inserts], function (err, result) {
      if (err) throw err;
      console.log("Number of records inserted: " + result.affectedRows);
      process.exit();
    });
  });
}


// Uses puppeteer and cheerio to grab the source video URL
function getMirrors(url) {
  return new Promise((resolve, reject) => {
    puppeteer
      .launch()
      .then((browser) => {
        return browser.newPage();
      })
      .then((page) => {
        return page.goto(url).then(async () => {
          return await page.waitForFunction(
            'document.querySelector("video").getAttribute("src") !== null'
          ).then(() => {
            return page.content();
          }).catch((err) => {
            console.log(err);
          });
        });
      })
      .then((html) => {
        $('video', html).each(function() {
          src = $(this).attr('src');
          resolve(src);
        });
      })
      .catch((err) => {
        reject(err);
      })
  })
}


// Uses remote upload to upload the mirror to openload
function remoteMirrors(mirror) {
  return new Promise((resolve, reject) => {
    ol.remoteUpload({
      url: mirror,
    })
    .then((res) => {
      resolve(res.id);
    }).catch((err) => {
      reject(err);
    })
  })
}