var express = require('express');
var app = express();
var port = process.env.PORT || 3000;

app.use(express.static('./static/'));

app.listen(port, function() {
  console.log("Listening on " + port);
});