const fs = require('fs');
const axios = require('axios');
const zlib = require('zlib');
const xml2js = require('xml2js');

const EPG_URL = 'https://github.com/ferteque/Curated-M3U-Repository/raw/refs/heads/main/epg6.xml.gz';
const OUTPUT_FILE = './public/epg6_modified.xml.gz';

async function run() {
  try {
    // 1️⃣ Download original EPG
    console.log('Downloading original EPG...');
    const response = await axios.get(EPG_URL, { responseType: 'arraybuffer' });
    const decompressed = zlib.gunzipSync(response.data).toString();

    // 2️⃣ Parse XML
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const xml = await parser.parseStringPromise(decompressed);

    // 3️⃣ Example edits (customize as you like)

    // Change channel display names
    xml.tv.channel.forEach(ch => {
      if (ch.$.id === 'channel1') {
        ch['display-name'][0] = 'My Custom Channel';
      }
    });

    // Change program titles and descriptions
    xml.tv.programme.forEach(p => {
      if (p.$.channel === 'channel1') {
        p.title[0]._ = 'Updated Morning Show';
        p.desc[0]._ = 'Custom description goes here';
      }
    });

    // 4️⃣ Build XML and compress
    const newXml = builder.buildObject(xml);
    const compressed = zlib.gzipSync(newXml);

    // Ensure public folder exists
    fs.mkdirSync('./public', { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, compressed);

    console.log('EPG updated and saved to', OUTPUT_FILE);
  } catch (err) {
    console.error('Error updating EPG:', err);
  }
}

run();
