const fs = require('fs');
const axios = require('axios');
const zlib = require('zlib');
const xml2js = require('xml2js');

// Source EPG
const EPG_URL = 'https://github.com/ferteque/Curated-M3U-Repository/raw/refs/heads/main/epg6.xml.gz';
const OUTPUT_FILE = './public/epg6_modified.xml.gz';

// Clean titles: remove LIVE, NEW, REPEAT
const cleanTitle = title => title.replace(/\b(LIVE|NEW|REPEAT)\b/gi, '').trim();

// Format date MM/DD/YYYY
const formatDate = dateStr => {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
};

// Format year
const formatYear = dateStr => {
  const d = new Date(dateStr);
  return isNaN(d) ? '' : String(d.getFullYear());
};

// Detect sports
const isSport = title => /\b(NFL|NBA|MLB|NHL)\b/i.test(title);

// Detect movies (no season/episode info)
const isMovie = title => !/S\d+E\d+/i.test(title);

// Extract season/episode info from description
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

    const parser = new xml2js.Parser({ explicitArray: true, mergeAttrs: true });
    const builder = new xml2js.Builder();
    const xml = await parser.parseStringPromise(decompressed);

    xml.tv.programme.forEach(p => {
      // Ensure title & desc exist
      if (!p.title) p.title = [{}];
      if (!p.desc) p.desc = [{}];

      // Grab original title/desc
      let originalTitle = '';
      if (p.title[0]) {
        if (typeof p.title[0] === 'string') originalTitle = p.title[0];
        else if (p.title[0]._) originalTitle = p.title[0]._;
      }
      const cleanedTitle = cleanTitle(originalTitle);

      let description = '';
      if (p.desc[0]) {
        if (typeof p.desc[0] === 'string') description = p.desc[0];
        else if (p.desc[0]._) description = p.desc[0]._;
      }

      const start = p.start || p.$?.start || '';
      const airdate = start ? formatDate(start) : '';

      if (isSport(cleanedTitle)) {
        // Sports: teams only
        const teams = cleanedTitle.replace(/\b(NFL|NBA|MLB|NHL|Football|Basketball|Hockey|Baseball|Game)\b/gi, '').trim();
        p.title[0]._ = teams || cleanedTitle;
        p.desc[0]._ = `${teams || cleanedTitle}. ${description}. (${airdate})`;
      } else if (isMovie(cleanedTitle)) {
        // Movies
        const year = start ? formatYear(start) : '';
        p.title[0]._ = cleanedTitle;
        p.desc[0]._ = `${cleanedTitle}. ${description}. (${year})`;
      } else {
        // TV shows
        const seasonEpisode = extractSeasonEpisode(description);
        const episodeName = description.split('.')[0] || cleanedTitle;
        p.title[0]._ = cleanedTitle;
        p.desc[0]._ = `${episodeName} - ${seasonEpisode}. ${description}. (${airdate})`;
      }
    });

    // Build XML and compress
    const newXml = builder.buildObject(xml);
    const compressed = zlib.gzipSync(newXml);

    // Save
    fs.mkdirSync('./public', { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, compressed);

    console.log('EPG updated and saved to', OUTPUT_FILE);
  } catch (err) {
    console.error('Error updating EPG:', err);
  }
}

run();
