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

function stringifyObject(obj, start = ''){
    var ret = '';
    for(var key in obj)
        if(typeof obj[key] === 'object')
            ret += `${start}${key}\n${stringifyObject(obj[key], start + '    ')}`;
        else
            ret += `${start}${key}: ${obj[key]}\n`;
    return ret;
}

app.post('/', function(req, res){
    console.log('Logs Received');
    console.log('--------------------------------------------------');
    console.log(stringifyObject(req.body));
    console.log('');
    res.end('');
});
