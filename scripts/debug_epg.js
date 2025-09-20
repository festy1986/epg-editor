const fs = require('fs');
const zlib = require('zlib');
const xml2js = require('xml2js');

// Helper functions to check rules
const containsInvalidWords = title => /\b(LIVE|NEW|REPEAT)\b/i.test(title);
const isSportTitle = title => /\b(NFL|NBA|MLB|NHL)\b/i.test(title);
const validEpisodeFormat = desc => /\- S\d+E\d+\./.test(desc); // TV shows
const validMovieFormat = desc => /\(\d{4}\)/.test(desc); // Movies

(async () => {
  try {
    const data = zlib.gunzipSync(fs.readFileSync('./public/epg6_modified.xml.gz'));
    const result = await xml2js.parseStringPromise(data);

    const programmes = result.tv.programme.map(p => {
      const channel = p.$?.channel || '';
      const title = p.title?.[0]?._ || p.title?.[0] || '';
      const desc = p.desc?.[0]?._ || p.desc?.[0] || '';
      const start = p.$?.start || '';
      const stop = p.$?.stop || '';

      let errors = [];

      // Check title rules
      if (containsInvalidWords(title)) errors.push('Title contains LIVE/NEW/REPEAT');
      if (isSportTitle(title) && !desc.match(/vs/i)) errors.push('Sport title not showing teams');

      // Check description rules
      if (!isSportTitle(title) && !validEpisodeFormat(desc) && !validMovieFormat(desc)) {
        errors.push('Description does not follow S1E1 / movie year format');
      }

      return { channel, title, desc, start, stop, errors };
    });

    // Print all programmes
    programmes.forEach(p => {
      console.log(JSON.stringify(p, null, 2));
    });

    // Print summary of violations
    const violations = programmes.filter(p => p.errors.length > 0);
    if (violations.length > 0) {
      console.log(`\n⚠️ Found ${violations.length} programmes violating rules:`);
      violations.forEach(v => {
        console.log(`- Channel: ${v.channel}, Title: "${v.title}", Issues: ${v.errors.join(', ')}`);
      });
    } else {
      console.log('\n✅ All programmes follow metadata rules.');
    }
  } catch (err) {
    console.error('Debug script error:', err);
  }
})();
