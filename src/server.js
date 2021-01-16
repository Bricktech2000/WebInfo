import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import _readline from 'readline-promise';
import path from 'path';
import { WebInfo } from './server/WebInfo-server.js'
import deepmerge from 'deepmerge';

const readline = _readline.default;
const __dirname = path.resolve();
const app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
//https://github.com/atmire/COUNTER-Robots/tree/master/generated
const botUserAgents = fs.readFileSync(path.join(__dirname, '/server/COUNTER_Robots_list.txt')).toString();

const port = 70;
const urlListFile = 'list.json';
const logFolder = 'logs/';
const USE_HTTPS = true;



function stringifyObject(obj, start = ''){
    var ret = '';
    for(var key in obj)
        if(typeof obj[key] === 'object')
            ret += `${start}${key}\n${stringifyObject(obj[key], start + '    ')}`;
        else
            ret += `${start}${key}: ${obj[key]}\n`;
    return ret;
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


app.get('/WebInfo-client.js', async function(req, res){
    res.sendFile(path.join(__dirname, '/client/WebInfo-client.js'));
});
app.get('/favicon.ico', function(req, res){
    res.end('');
});

app.get(/\/.*?.*/, async function(req, res){
    var urlList = await getUrlList();
    var url = req.originalUrl.replace(/\?.*$/g, '').replace(/^\/|\/$/g, '');
    if(urlList[url]){
        if(urlList[url].count != 0){
            for(var userAgent of botUserAgents.split('\n'))
                if(userAgent && new RegExp(userAgent).test(req.headers['user-agent']) || !req.headers['user-agent']){
                    console.log('Request to URL has detected bot: ', url);
                    console.log('Bot user agent: ', userAgent);
                    res.status(300).redirect('https://' + urlList[url].redirect);
                    return;
                }
            fs.readFile(path.join(__dirname, '/client/index.html'), (err, data) => {
                if(err) throw err;
                res.send(data.toString().replace('<<<REDIRECT>>>', JSON.stringify(urlList[url].redirect)));
                res.end();
            });
            console.log('Request to URL successful: ' + url);
        }else console.log('Request to URL has a 0 count: ' + url);
    }else console.log('Request to URL is not in urlList: ' + url);
});

app.post(/\/.*?.*/, async function(req, res){
    //https://davidwalsh.name/javascript-deep-merge
    var data = deepmerge(req.body, await WebInfo.getData(req));
    res.end('');

    var log = '';
    log += '--------------------------------------------------\n';
    log += stringifyObject(data) + '\n\n\n';

    var urlList = await getUrlList();
    var url = req.originalUrl.replace(/\?.*$/g, '').replace(/^\/|\/$/g, '');
    if(urlList[url]){
        fs.writeFile(path.join(logFolder, url + '.log'), log, { flag: 'a+' }, (err) => {
            if(err && err.code != 'ENOENT') throw err;
        });
        urlList[url].count--;
        await saveUrlList(urlList);
    }
});

app.use(express.static(path.join(__dirname, '/client')));


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
        var command = await rl.questionAsync('> ');
        var urlList = await getUrlList();
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
                    fs.readFile(path.join(logFolder, url + '.log'), 'utf-8', (err, data) => {
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
                        fs.unlink(path.join(logFolder, url + '.log'), (err) => {
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

import http from 'http';
import https from 'https';

var server;
if(USE_HTTPS){
    var p = '/etc/letsencrypt/live/info.emilien.ml/';
    var credentials = {
      key: fs.readFileSync(path.join(p, 'privkey.pem')),
      cert: fs.readFileSync(path.join(p, 'fullchain.pem')),
    };

    server = https.createServer(credentials, app);
}else server = http.createServer(app);

server.listen(port, function(){
    console.log(`listenning on localhost:${port}\n`);
}).on('error', (e) => {
    if(e.code != 'EADDRINUSE') throw e;
    console.log(`Server already listenning on localhost:${port}. Interactive shell started.\n`);
    interactiveShell();
});
