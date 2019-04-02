var mysql = require('mysql');

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "animewebsite"
});

const store = function(episodes) {
  let inserts = [];
  episodes.forEach((episode) => {
    episode.name = episode.name.substring(0, episode.name.length-1);
    episode.episode = parseInt(episode.episode.substring(1, episode.episode.length));
    inserts.push([episode.openload_id, episode.name, episode.episode]);
  });

  con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    var sql = "INSERT INTO openload_uploads (openload_file_id, series_name, episode) VALUES ?";
    con.query(sql, [inserts], function (err, result) {
      if (err) throw err;
      console.log("Number of records inserted: " + result.affectedRows);
    });
  });
  process.exit();
}

module.exports = store;