const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

const port = 7070;
const urlListFile = 'list.json';
const logFolder = 'logs/';


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

async function getUrlList(){
    var text = await new Promise((resolve, reject) => {
        fs.readFile(urlListFile, 'utf-8', (err, data) => {
            if(err && err.code != 'ENOENT') throw err;
            resolve(data);
        });
    });
    return JSON.parse(text || '{}');
}
async function saveUrlList(list){
    var text = await new Promise((resolve, reject) => {
        //https://stackoverflow.com/questions/12899061/creating-a-file-only-if-it-doesnt-exist-in-node-js
        fs.writeFile(urlListFile, JSON.stringify(list), { flag: 'w+' }, (err) => {
            if(err) throw err;
            resolve();
        });
    });
}

function isYes(input){
    return input.toLowerCase().startsWith('y');
}


//https://stackoverflow.com/questions/43638105/how-to-get-synchronous-readline-or-simulate-it-using-async-in-nodejs
const getLine = (function () {
    const getLineGen = (async function* () {
        for await (const line of rl) {
            yield line;
        }
    })();
    return async () => ((await getLineGen.next()).value);
})();

app.get('/script.js', async function(req, res){
    res.sendFile(__dirname + '/client/script.js');
});

app.get('/*', async function(req, res){
    var urlList = await getUrlList();
    var url = req.originalUrl.slice(1);
    if(urlList[url])
        if(urlList[url].count != 0){
            fs.readFile(__dirname + '/client/index.html', (err, data) => {
                if(err) throw err;
                res.send(data.toString().replace('<<<REDIRECT>>>', JSON.stringify(urlList[url].redirect)));
                res.end();
            });
            console.log('\nRequest to URL: ' + url);
            urlList[url].count--;
            await saveUrlList(urlList);
        }
});

app.post('/*', async function(req, res){
    var data = req.body;
    getData(data, req);
    res.end('');

    var log = '';
    log += '--------------------------------------------------\n';
    log += stringifyObject(data) + '\n\n\n';

    var urlList = await getUrlList();
    var url = req.originalUrl.slice(1);
    if(urlList[url])
        fs.writeFile(logFolder + url + '.log', log, { flag: 'a+' }, (err) => {
            if(err && err.code != 'ENOENT') throw err;
        });
});

app.use(express.static(__dirname + '/client'));


async function interactiveShell() {
    while(true){
        var urlList = await getUrlList();
        console.log('Items:');
        for(var url of Object.keys(urlList)){
            var c = urlList[url].count;
            console.log(`    [${c}]${
                ' '.repeat(12 - c.toString().length - url.toString().length)
            } ${url}->${urlList[url].redirect}: ${urlList[url].comment}`);
        }

        process.stdout.write('Please enter a URL: ');
        var url = await getLine();
        if(urlList[url]){
            process.stdout.write(`Removing URL: ${url}. Are tou sure? `);
            if(isYes(await getLine())){
                delete urlList[url];
                await saveUrlList(urlList);
                process.stdout.write('Removed URL.\n');
            }else
                process.stdout.write('Cancelled removing URL.\n');
        }else{
            if(!url){
                url = '';
                for(var i = 0; i < 5; i++)
                    url += Math.floor(Math.random() * 10);
            }
            process.stdout.write(`Adding URL: ${url}. Are tou sure? `);
            urlList[url] = {};
            if(isYes(await getLine())){
                process.stdout.write('Enter comment: ');
                urlList[url].comment = await getLine();
                process.stdout.write('Enter redirection URL: ');
                urlList[url].redirect = await getLine();
                process.stdout.write('Enter maximum redirections: ');
                urlList[url].count = await getLine();
                await saveUrlList(urlList);
            }else
                process.stdout.write('Cancelled adding URL.\n');
        }
    }
};

app.listen(port, function(){
    console.log(`listenning on localhost:${port}`);
}).on('error', (e) => {
    if(e.code != 'EADDRINUSE') throw e;
    console.log(`Server already running. Interactive shell started.\n`);
    interactiveShell();
});
