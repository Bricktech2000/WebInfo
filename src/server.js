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

const geoip = require('geoip-lite');
const uaparser = require('ua-parser-js');
function getData(data, req){
    //https://github.com/geoip-lite/node-geoip
    var ip = req.connection.remoteAddress;
    data['location'] = {};
    data['location'].publicIP = ip;

    var lookup = geoip.lookup(ip);
    if(!lookup)
        data['location'].location = '[not found]';
    else{
        data['location'].country = lookup.country || '[country not found]';
        data['location'].region = lookup.region || '[region not found]';
        data['location'].city = lookup.city || '[city not found]';
        data['location'].longitude = lookup.ll[0];
        data['location'].latitude = lookup.ll[1];
    }

    //https://www.npmjs.com/package/ua-parser-js
    var res = uaparser(req.headers['user-agent']);
    data['general'].browser = `${res.browser.name} ${res.browser.version}`;
    data['device'] = {...res.device, ...data['device']};
    data['device'].operatingSystem = `${res.os.name} ${res.os.version}`;
    data['CPU'].architecture = res.cpu.architecture || '[unknown]';
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
