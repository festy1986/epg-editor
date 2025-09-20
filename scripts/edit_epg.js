const fs = require('fs');
const axios = require('axios');
const zlib = require('zlib');
const xml2js = require('xml2js');

// Source EPG
const EPG_URL = 'https://github.com/ferteque/Curated-M3U-Repository/raw/refs/heads/main/epg6.xml.gz';
const OUTPUT_FILE = './public/epg6_modified.xml.gz';

// Helper functions
const cleanTitle = title => title.replace(/\b(LIVE|NEW|REPEAT)\b/gi, '').trim();

const formatDate = dateStr => {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

const formatYear = dateStr => {
  const d = new Date(dateStr);
  return isNaN(d) ? '' : String(d.getFullYear());
};

// Detect if program is a sport
const isSport = title => /\b(NFL|NBA|MLB|NHL)\b/i.test(title);

// Detect if program is a movie (no season/episode info)
const isMovie = title => !/S\d+E\d+/i.test(title);

// Extract season/episode info
const extractSeasonEpisode = desc => {
  const match = desc.match(/S(\d+)E(\d+)/i);
  if (match) return `S${parseInt(match[1])}E${parseInt(match[2])}`;
  return '';
};

async function run() {
  try {
    console.log('Downloading original EPG...');
    const response = await axios.get(EPG_URL, { responseType: 'arraybuffer' });
    const decompressed = zlib.gunzipSync(response.data).toString();

    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const xml = await parser.parseStringPromise(decompressed);

    xml.tv.programme.forEach(p => {
      // Ensure title and desc exist
      if (!p.title) p.title = [{}];
      if (!p.desc) p.desc = [{}];

      const originalTitle = p.title[0]._ || '';
      const cleanedTitle = cleanTitle(originalTitle);
      const description = p.desc[0]._ || '';
      const start = p.$.start;
      const airdate = start ? formatDate(start) : '';

      if (isSport(cleanedTitle)) {
        // Sports metadata
        const teams = cleanedTitle.replace(/\b(NFL|NBA|MLB|NHL|Football|Basketball|Hockey|Baseball|Game)\b/gi, '').trim();
        p.title[0]._ = teams;
        p.desc[0]._ = `${teams}. ${description}. (${airdate})`;
      } else if (isMovie(cleanedTitle)) {
        // Movie metadata
        p.title[0]._ = cleanedTitle;
        const year = start ? formatYear(start) : '';
        p.desc[0]._ = `${cleanedTitle}. ${description}. (${year})`;
      } else {
        // TV show metadata
        const seasonEpisode = extractSeasonEpisode(description);
        const episodeName = description.split('.')[0] || '';
        p.title[0]._ = cleanedTitle;
        p.desc[0]._ = `${episodeName} - ${seasonEpisode}. ${description}. (${airdate})`;
      }
    });

    // Build XML and compress
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
