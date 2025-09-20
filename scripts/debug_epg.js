const fs = require('fs');
const zlib = require('zlib');
const xml2js = require('xml2js');

const EPG_FILE = './public/epg6_modified.xml.gz';

async function run() {
  try {
    const compressed = fs.readFileSync(EPG_FILE);
    const xmlData = zlib.gunzipSync(compressed).toString();

    const parser = new xml2js.Parser();
    const xml = await parser.parseStringPromise(xmlData);

    const channels = {};

    // Collect programs per channel
    xml.tv.programme.forEach(p => {
      const channel = p.$.channel;
      if (!channels[channel]) channels[channel] = [];
      channels[channel].push({
        title: p.title[0]?._ || '',
        desc: p.desc[0]?._ || '',
        start: p.$.start,
        stop: p.$.stop
      });
    });

    // Print all channels and first 10 programs
    Object.keys(channels).forEach(channel => {
      console.log(`\n=== Channel: ${channel} ===`);
      channels[channel].slice(0, 10).forEach((prog, i) => {
        console.log(`Program ${i + 1}:`);
        console.log(`  Title: ${prog.title}`);
        console.log(`  Desc: ${prog.desc}`);
        console.log(`  Start: ${prog.start}`);
        console.log(`  Stop: ${prog.stop}\n`);
      });
    });

    console.log('\nDebug complete. Total channels:', Object.keys(channels).length);
  } catch (err) {
    console.error('Error reading or parsing EPG:', err);
  }
}

run();
