const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const port = 7070;

app.use(express.static(__dirname + '/client'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.listen(port, function(){
    console.log(`listenning on localhost:${port}`);
});
