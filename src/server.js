const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require('fs');
const readline = require('readline-promise').default;

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//https://github.com/atmire/COUNTER-Robots/tree/master/generated
const botUserAgents = fs.readFileSync(__dirname + '/COUNTER_Robots_list.txt').toString();

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
    data['general'] = {datetimeServer: new Date().toLocaleString('en-CA', { hour12: false }), ...data['general']};

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


app.get('/script.js', async function(req, res){
    res.sendFile(__dirname + '/client/script.js');
});

app.get(/\/.*?.*/, async function(req, res){
    var urlList = await getUrlList();
    var url = req.originalUrl.split('?')[0].slice(1);
    if(urlList[url]){
        if(urlList[url].count != 0){
            for(userAgent of botUserAgents.split('\n'))
                if(userAgent && new RegExp(userAgent).test(req.headers['user-agent']) || !req.headers['user-agent']){
                    console.log('Bot detected: ', userAgent);
                    res.status(300).redirect('https://' + urlList[url].redirect);
                    return;
                }
            fs.readFile(__dirname + '/client/index.html', (err, data) => {
                if(err) throw err;
                res.send(data.toString().replace('<<<REDIRECT>>>', JSON.stringify(urlList[url].redirect)));
                res.end();
            });
            console.log('Request to URL: ' + url);
        }
    }
});

app.post(/\/.*?.*/, async function(req, res){
    var data = req.body;
    getData(data, req);
    res.end('');

    var log = '';
    log += '--------------------------------------------------\n';
    log += stringifyObject(data) + '\n\n\n';

    var urlList = await getUrlList();
    var url = req.originalUrl.split('?')[0].slice(1);
    if(urlList[url]){
        fs.writeFile(logFolder + url + '.log', log, { flag: 'a+' }, (err) => {
            if(err && err.code != 'ENOENT') throw err;
        });
        urlList[url].count--;
        await saveUrlList(urlList);
    }
});

app.use(express.static(__dirname + '/client'));


async function interactiveShell() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    function listItems(){
        console.log('Items:');
        for(var url of Object.keys(urlList)){
            var c = urlList[url].count;
            console.log(`    [${c}]${
                ' '.repeat(12 - c.toString().length - url.toString().length)
            } ${url}->${urlList[url].redirect}: ${urlList[url].comment}`);
        }
        console.log();
    }
    async function editEntry(url, def){
        urlList[url] = {};
        urlList[url].comment = await rl.questionAsync('Comment: ') || def.comment;
        urlList[url].redirect = await rl.questionAsync('Redirection URL: ') || def.redirect;
        urlList[url].count = await rl.questionAsync('Maximum Usage: ') || def.count;
        await saveUrlList(urlList);
    }
    while(true){
        var urlList = await getUrlList();

        var command = await rl.questionAsync('> ');
        switch(command){
            case 'help':
                console.log('Here is a list of available commands:');
                console.log('    help   display this help page');
                console.log('    exit   exit the program');
                console.log('    add    add an item to the list');
                console.log('    rm     remove an item from the list');
                console.log('    edit   edit an item from the list');
                console.log('    list   list all items in the list');
                console.log('    view   view the logs of an item from the list');
                console.log('    clr    clear the logs of an item form the list');
                console.log();
                break;
            case 'add':
                var url = await rl.questionAsync('URL: ');
                if(!url){
                    url = '';
                    for(var i = 0; i < 5; i++)
                        url += Math.floor(Math.random() * 10);
                }
                await editEntry(url, {
                    count: -1,
                    redirect: '/',
                    comment: '',
                });
                listItems();
                break;
            case 'rm':
                var url = await rl.questionAsync('URL: ');
                var confirmation = await rl.questionAsync(`Removing URL: ${url} [Y/N]: `);
                if(isYes(confirmation)){
                    delete urlList[url];
                    await saveUrlList(urlList);
                    listItems();
                }else console.log('URL not removed.');
                break;
            case 'edit':
                var url = await rl.questionAsync('URL: ');
                if(!url || !urlList[url]){
                    console.log('Error: URL not found.');
                    continue;
                }
                await editEntry(url, urlList[url]);
                listItems();
                break;
            case 'list':
                listItems();
                break;
            case 'view':
                var url = await rl.questionAsync('URL: ');
                if(!url || !urlList[url]){
                    console.log('Error: URL not found.');
                    continue;
                }
                var logs = await new Promise((resolve, reject) => {
                    fs.readFile(logFolder + url + '.log', 'utf-8', (err, data) => {
                        if(err){
                            if(err.code != 'ENOENT') throw err;
                            else console.log('Error: log file not found for URL.');
                            data = '';
                        }
                        resolve(data);
                    });
                });
                console.log(logs);
                break;
            case 'clr':
                var url = await rl.questionAsync('URL: ');
                if(!url || !urlList[url]){
                    console.log('Error: URL not found.');
                    continue;
                }
                var confirmation = await rl.questionAsync(`Clearing URL: ${url} [Y/N]: `);
                if(isYes(confirmation)){
                    await new Promise((resolve, reject) => {
                        fs.unlink(logFolder + url + '.log', (err) => {
                            if(err && err.code != 'ENOENT') throw err;
                            resolve();
                        });
                    });
                    await saveUrlList(urlList);
                    listItems();
                }else console.log('URL not cleared.');
                break;
            case 'exit':
                process.exit(0);
            case '':
                console.log('Error: Please enter a command.');
                console.log();
                break;
            default:
                console.log('Error: Command not found. Type in \'help\' for help.');
                console.log();
                break;
        }
    }
};

app.listen(port, function(){
    console.log(`listenning on localhost:${port}\n`);
}).on('error', (e) => {
    if(e.code != 'EADDRINUSE') throw e;
    console.log(`Server already listenning on localhost:${port}. Interactive shell started.\n`);
    interactiveShell();
});
