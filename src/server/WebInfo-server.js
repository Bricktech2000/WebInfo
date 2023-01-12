import geoip from 'geoip-lite';
import uaparser from 'ua-parser-js';

const WebInfo = {
  getData: async function (req) {
    let data = {};

    await (async () => {
      try {
        data['general'] = {};
        data['general'] = {
          datetimeServer: new Date().toLocaleString('en-CA', { hour12: false }),
          ...data['general'],
        };
      } catch (e) {
        console.warn(e);
      }
    })();

    await (async () => {
      try {
        //https://github.com/geoip-lite/node-geoip
        const ip = req.connection.remoteAddress;
        data['location'] = {};
        data['location'].publicIP = ip;

        const lookup = geoip.lookup(ip);
        if (!lookup) data['location'].location = '[not found]';
        else {
          data['location'].country = lookup.country || '[country not found]';
          data['location'].region = lookup.region || '[region not found]';
          data['location'].city = lookup.city || '[city not found]';
          data['location'].longitude = `${lookup.ll[0]}° N`;
          data['location'].latitude = `${lookup.ll[1]}° E/W`;
        }
      } catch (e) {
        console.warn(e);
      }
    })();

    await (async () => {
      try {
        data['device'] = {};
        data['CPU'] = {};

        //https://www.npmjs.com/package/ua-parser-js
        const res = uaparser(req.headers['user-agent']);
        data['general'].browser = `${res.browser.name} ${res.browser.version}`;
        data['device'] = { ...res.device, ...data['device'] };
        data['device'].operatingSystem = `${res.os.name} ${res.os.version}`;
        data['CPU'].architecture = res.cpu.architecture || '[unknown]';
      } catch (e) {
        console.warn(e);
      }
    })();

    return data;
  },
};

export { WebInfo };
