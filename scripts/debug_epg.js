const fs = require('fs');
const zlib = require('zlib');
const xml2js = require('xml2js');

(async () => {
  try {
    const data = zlib.gunzipSync(fs.readFileSync('./public/epg6_modified.xml.gz'));
    const result = await xml2js.parseStringPromise(data);

    // Map all programmes for inspection
    const programmes = result.tv.programme.map(p => ({
      channel: p.$?.channel,
      title: p.title?.[0]?._ || p.title?.[0] || '',
      desc: p.desc?.[0]?._ || p.desc?.[0] || '',
      start: p.$?.start,
      stop: p.$?.stop
    }));

    console.log(JSON.stringify(programmes, null, 2));
  } catch (err) {
    console.error('Debug script error:', err);
  }
})();
