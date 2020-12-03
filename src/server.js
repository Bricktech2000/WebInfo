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

//https://github.com/geoip-lite/node-geoip
const geoip = require('geoip-lite');
function getData(data, req){
    var ip = req.connection.remoteAddress;
    data['location'] = {};
    data['location'].publicIP = ip;

    var lookup = geoip.lookup(ip);
    if(!lookup){
        data['location'].location = '[geolocation not found]';
        return;
    }
    data['location'].country = lookup.country || '[country not found]';
    data['location'].region = lookup.region || '[region not found]';
    data['location'].city = lookup.city || '[city not found]';
    data['location'].longitude = lookup.ll[0];
    data['location'].latitude = lookup.ll[1];
}

app.post('/', function(req, res){
    var data = req.body;
    getData(data, req);
    console.log('Logs Received');
    console.log('--------------------------------------------------');
    console.log(stringifyObject(data));
    console.log('');
    res.end('');
});
