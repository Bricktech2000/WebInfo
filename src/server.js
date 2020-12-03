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

app.post('/', function(req, res){
    var str = '';
    for(var key in req.body)
        str += `${key}: ${req.body[key]}\n`;
    console.log(str);
    res.end('');
})
