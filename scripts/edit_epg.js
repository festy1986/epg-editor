const fs = require('fs');
const axios = require('axios');
const zlib = require('zlib');
const xml2js = require('xml2js');

// Source EPG
const EPG_URL = 'https://github.com/ferteque/Curated-M3U-Repository/raw/refs/heads/main/epg6.xml.gz';
const OUTPUT_FILE = './public/epg6_modified.xml.gz';

// Helper functions
const cleanTitle = title =>
  title.replace(/\b(LIVE|NEW|REPEAT)\b/gi, '').replace(/:/g, '').trim();

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

// Detect program type
const isSport = title => /\b(NFL|NBA|MLB|NHL)\b/i.test(title);
const isMovie = title => !/S\d+E\d+/i.test(title);

// Extract season/episode info
const extractSeasonEpisode = desc => {
  const match = desc.match(/S(\d+)E(\d+)/i);
  if (match) return `S${parseInt(match[1])}E${parseInt(match[2])}`;
  return '';
};

// Extract team names from sports title (if possible)
const extractTeams = title => {
  // Remove league keywords, "Live", etc.
  return title.replace(/\b(NFL|NBA|MLB|NHL|Football|Basketball|Hockey|Baseball|Game|Live|Match)\b/gi, '').trim();
};

// Main function
async function run() {
  try {
    console.log('Downloading original EPG...');
    const response = await axios.get(EPG_URL, { responseType: 'arraybuffer' });
    const decompressed = zlib.gunzipSync(response.data).toString();

    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const xml = await parser.parseStringPromise(decompressed);

    // Loop over all programmes
    xml.tv.programme.forEach((p, index) => {
      // Ensure title & desc exist
      if (!p.title) p.title = [''];
      if (!p.desc) p.desc = [''];

      const originalTitle = p.title[0] || '';
      const originalDesc = p.desc[0] || '';
      const start = p.$?.start || '';
      const airdate = start ? formatDate(start) : '';
      const year = start ? formatYear(start) : '';

      let cleanedTitle = cleanTitle(originalTitle);

      // Determine program type
      if (isSport(cleanedTitle)) {
        // Sports formatting
        let matchup = extractTeams(cleanedTitle);
        p.title[0] = matchup || cleanedTitle;
        const descText = originalDesc ? originalDesc.trim() : '';
        p.desc[0] = `${matchup}. ${descText}${airdate ? ` (${airdate})` : ''}`.replace(/\s+/g,' ').trim();

      } else if (isMovie(cleanedTitle)) {
        // Movie formatting
        p.title[0] = cleanedTitle;
        const descText = originalDesc ? originalDesc.trim() : '';
        p.desc[0] = `${cleanedTitle}. ${descText}${year ? ` (${year})` : ''}`.replace(/\s+/g,' ').trim();

      } else {
        // TV show formatting
        const seasonEpisode = extractSeasonEpisode(originalDesc);
        const episodeName = originalDesc.split('.')[0] || cleanedTitle;
        const descText = originalDesc.trim();
        p.title[0] = cleanedTitle;
        p.desc[0] = `${episodeName}${seasonEpisode ? ` - ${seasonEpisode}` : ''}. ${descText}${airdate ? ` (${airdate})` : ''}`.replace(/\s+/g,' ').trim();
      }

      // Log for verification
      console.log(`${index + 1}: Channel=${p.$.channel} | Title=${p.title[0]} | Desc=${p.desc[0]}`);
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
