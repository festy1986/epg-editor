const fs = require('fs');
const axios = require('axios');
const zlib = require('zlib');
const xml2js = require('xml2js');

// Source EPG
const EPG_URL = 'https://github.com/ferteque/Curated-M3U-Repository/raw/refs/heads/main/epg6.xml.gz';
const OUTPUT_FILE = './public/epg6_modified.xml.gz';

// Channels to process
const CHANNELS = [
  { full: "Comet(COMET).us", clean: "Comet" },
  { full: "Laff(LAFF).us", clean: "Laff" },
  { full: "ABC(WMTW).us", clean: "ABC" },
  { full: "FOX(WFXT).us", clean: "FOX" },
  { full: "FOX(WPFO).us", clean: "FOX" },
  { full: "NBC(WBTSCD).us", clean: "NBC" },
  { full: "NBC(WCSH).us", clean: "NBC" },
  { full: "ABC(WCVB).us", clean: "ABC" },
  { full: "NewEnglandCableNews(NECN).us", clean: "NewEnglandCableNews" },
  { full: "PBS(HD01).us", clean: "PBS" },
  { full: "CW(WLVI).us", clean: "CW" },
  { full: "CBS(WBZ).us", clean: "CBS" },
  { full: "WSBK.us", clean: "WSBK" },
  { full: "CBS(WGME).us", clean: "CBS" },
  { full: "ION.us", clean: "ION" },
  { full: "MeTVNetwork(METVN).us", clean: "MeTVNetwork" },
  { full: "INSPHD(INSPHD).us", clean: "INSPHD" },
  { full: "GameShowNetwork(GSN).us", clean: "GameShowNetwork" },
  { full: "FamilyEntertainmentTelevision(FETV).us", clean: "FamilyEntertainmentTelevision" },
  { full: "Heroes&IconsNetwork(HEROICN).us", clean: "Heroes&IconsNetwork" },
  { full: "TurnerClassicMoviesHD(TCMHD).us", clean: "TurnerClassicMoviesHD" },
  { full: "OprahWinfreyNetwork(OWN).us", clean: "OprahWinfreyNetwork" },
  { full: "BET.us", clean: "BET" },
  { full: "DiscoveryChannel(DSC).us", clean: "DiscoveryChannel" },
  { full: "Freeform(FREEFRM).us", clean: "Freeform" },
  { full: "USANetwork(USA).us", clean: "USANetwork" },
  { full: "NewEnglandSportsNetwork(NESN).us", clean: "NewEnglandSportsNetwork" },
  { full: "NewEnglandSportsNetworkPlus(NESNPL).us", clean: "NewEnglandSportsNetworkPlus" },
  { full: "NBCSportsBoston(NBCSB).us", clean: "NBCSportsBoston" },
  { full: "ESPN.us", clean: "ESPN" },
  { full: "ESPN2.us", clean: "ESPN2" },
  { full: "ESPNEWS.us", clean: "ESPNEWS" },
  { full: "AWealthofEntertainmentHD(AWEHD).us", clean: "AWealthofEntertainmentHD" },
  { full: "WEtv(WE).us", clean: "WEtv" },
  { full: "OxygenTrueCrime(OXYGEN).us", clean: "OxygenTrueCrime" },
  { full: "DisneyChannel(DISN).us", clean: "DisneyChannel" },
  { full: "DisneyJunior(DJCH).us", clean: "DisneyJunior" },
  { full: "DisneyXD(DXD).us", clean: "DisneyXD" },
  { full: "CartoonNetwork(TOONLSH).us", clean: "CartoonNetwork" },
  { full: "Nickelodeon(NIK).us", clean: "Nickelodeon" },
  { full: "MSNBC.us", clean: "MSNBC" },
  { full: "CableNewsNetwork(CNN).us", clean: "CNN" },
  { full: "HLN.us", clean: "HLN" },
  { full: "CNBC.us", clean: "CNBC" },
  { full: "FoxNewsChannel(FNC).us", clean: "FoxNewsChannel" },
  { full: "LifetimeRealWomen(LRW).us", clean: "LifetimeRealWomen" },
  { full: "TNT.us", clean: "TNT" },
  { full: "Lifetime(LIFE).us", clean: "Lifetime" },
  { full: "LMN.us", clean: "LMN" },
  { full: "TLC.us", clean: "TLC" },
  { full: "AMC.us", clean: "AMC" },
  { full: "Home&GardenTelevisionHD(HGTVD).us", clean: "Home&GardenTelevisionHD" },
  { full: "TheTravelChannel(TRAV).us", clean: "TheTravelChannel" },
  { full: "A&E(AETV).us", clean: "A&E" },
  { full: "FoodNetwork(FOOD).us", clean: "FoodNetwork" },
  { full: "Bravo(BRAVO).us", clean: "Bravo" },
  { full: "truTV(TRUTV).us", clean: "truTV" },
  { full: "NationalGeographicHD(NGCHD).us", clean: "NationalGeographicHD" },
  { full: "HallmarkChannel(HALL).us", clean: "HallmarkChannel" },
  { full: "HallmarkFamily(HFM).us", clean: "HallmarkFamily" },
  { full: "HallmarkMystery(HMYS).us", clean: "HallmarkMystery" },
  { full: "SYFY.us", clean: "SYFY" },
  { full: "AnimalPlanet(APL).us", clean: "AnimalPlanet" },
  { full: "History(HISTORY).us", clean: "History" },
  { full: "TheWeatherChannel(WEATH).us", clean: "TheWeatherChannel" },
  { full: "ParamountNetwork(PAR).us", clean: "ParamountNetwork" },
  { full: "ComedyCentral(COMEDY).us", clean: "ComedyCentral" },
  { full: "FXM.us", clean: "FXM" },
  { full: "FXX.us", clean: "FXX" },
  { full: "FX.us", clean: "FX" },
  { full: "E!EntertainmentTelevisionHD(EHD).us", clean: "E!EntertainmentTelevisionHD" },
  { full: "AXSTV(AXSTV).us", clean: "AXSTV" },
  { full: "TVLand(TVLAND).us", clean: "TVLand" },
  { full: "TBS.us", clean: "TBS" },
  { full: "VH1.us", clean: "VH1" },
  { full: "MTV-MusicTelevision(MTV).us", clean: "MTV-MusicTelevision" },
  { full: "CMT(CMTV).us", clean: "CMT" },
  { full: "DestinationAmerica(DEST).us", clean: "DestinationAmerica" },
  { full: "MagnoliaNetwork(MAGN).us", clean: "MagnoliaNetwork" },
  { full: "MagnoliaNetworkHD(Pacific)(MAGNPHD).us", clean: "MagnoliaNetworkHD(Pacific)" },
  { full: "DiscoveryLifeChannel(DLC).us", clean: "DiscoveryLifeChannel" },
  { full: "NationalGeographicWild(NGWILD).us", clean: "NationalGeographicWild" },
  { full: "SmithsonianChannelHD(SMTSN).us", clean: "SmithsonianChannelHD" },
  { full: "BBCAmerica(BBCA).us", clean: "BBCAmerica" },
  { full: "POP(POPSD).us", clean: "POP" },
  { full: "Crime&InvestigationNetworkHD(CINHD).us", clean: "Crime&InvestigationNetworkHD" },
  { full: "Vice(VICE).us", clean: "Vice" },
  { full: "InvestigationDiscoveryHD(IDHD).us", clean: "InvestigationDiscoveryHD" },
  { full: "ReelzChannel(REELZ).us", clean: "ReelzChannel" },
  { full: "DiscoveryFamilyChannel(DFC).us", clean: "DiscoveryFamilyChannel" },
  { full: "Science(SCIENCE).us", clean: "Science" },
  { full: "AmericanHeroesChannel(AHC).us", clean: "AmericanHeroesChannel" },
  { full: "AMC+(AMCPLUS).us", clean: "AMC+" },
  { full: "Fuse(FUSE).us", clean: "Fuse" },
  { full: "MusicTelevisionHD(MTV2HD).us", clean: "MusicTelevisionHD" },
  { full: "IFC.us", clean: "IFC" },
  { full: "FYI(FYISD).us", clean: "FYI" },
  { full: "CookingChannel(COOK).us", clean: "CookingChannel" },
  { full: "Logo(LOGO).us", clean: "Logo" },
  { full: "AdultSwim(ADSM).ca", clean: "AdultSwim" },
  { full: "ANTENNA(KGBTDT).us", clean: "ANTENNA" },
  { full: "CHARGE!(CHARGE).us", clean: "CHARGE!" },
  { full: "FS1.us", clean: "FS1" },
  { full: "FS2.us", clean: "FS2" },
  { full: "NFLNetwork(NFLNET).us", clean: "NFLNetwork" },
  { full: "NHLNetwork(NHLNET).us", clean: "NHLNetwork" },
  { full: "MLBNetwork(MLBN).us", clean: "MLBNetwork" },
  { full: "NBATV(NBATV).us", clean: "NBATV" },
  { full: "CBSSportsNetwork(CBSSN).us", clean: "CBSSportsNetwork" },
  { full: "Ovation(OVATION).us", clean: "Ovation" },
  { full: "UPTV.us", clean: "UPTV" },
  { full: "COZITV(COZITV).us", clean: "COZITV" },
  { full: "OutdoorChannel(OUTD).us", clean: "OutdoorChannel" },
  { full: "ASPiRE(ASPRE).us", clean: "ASPiRE" },
  { full: "HBO.us", clean: "HBO" },
  { full: "HBO2(HBOHIT).us", clean: "HBO2" },
  { full: "HBOComedy(HBOC).us", clean: "HBOComedy" },
  { full: "HBOSignature(HBODRAM).us", clean: "HBOSignature" },
  { full: "HBOWest(HBOHDP).us", clean: "HBOWest" },
  { full: "HBOZone(HBOMOV).us", clean: "HBOZone" },
  { full: "CinemaxHD(MAXHD).us", clean: "CinemaxHD" },
  { full: "MoreMAX(MAXHIT).us", clean: "MoreMAX" },
  { full: "ActionMAX(MAXACT).us", clean: "ActionMAX" },
  { full: "5StarMAX(MAXCLAS).us", clean: "5StarMAX" },
  { full: "Paramount+withShowtimeOnDemand(SHOWDM).us", clean: "Paramount+withShowtimeOnDemand" },
  { full: "ShowtimeExtreme(SHOWX).us", clean: "ShowtimeExtreme" },
  { full: "ShowtimeNext(NEXT).us", clean: "ShowtimeNext" },
  { full: "ShowtimeShowcase(SHOCSE).us", clean: "ShowtimeShowcase" },
  { full: "ShowtimeFamilyzone(FAMZ).us", clean: "ShowtimeFamilyzone" },
  { full: "ShowtimeWomen(WOMEN).us", clean: "ShowtimeWomen" },
  { full: "Starz(STARZ).us", clean: "Starz" },
  { full: "StarzEdge(STZE).us", clean: "StarzEdge" },
  { full: "StarzCinema(STZCI).us", clean: "StarzCinema" },
  { full: "StarzComedy(STZC).us", clean: "StarzComedy" },
  { full: "StarzEncore(STZENC).us", clean: "StarzEncore" },
  { full: "StarzEncoreBlack(STZENBK).us", clean: "StarzEncoreBlack" },
  { full: "StarzEncoreClassic(STZENCL).us", clean: "StarzEncoreClassic" },
  { full: "StarzEncoreFamily(STZENFM).us", clean: "StarzEncoreFamily" },
  { full: "StarzEncoreWesterns(STZENWS).us", clean: "StarzEncoreWesterns" },
  { full: "StarzKids(STZK).us", clean: "StarzKids" },
  { full: "StarzEncoreAction(STZENAC).us", clean: "StarzEncoreAction" },
  { full: "ScreenPix(SCRNPIX).us", clean: "ScreenPix" },
  { full: "ScreenPixAction(SCRNACT).us", clean: "ScreenPixAction" },
  { full: "ScreenPixVoices(SCRNVOI).us", clean: "ScreenPixVoices" },
  { full: "ScreenPixWesterns(SCRNWST).us", clean: "ScreenPixWesterns" },
  { full: "MoviePlex(MPLEX).us", clean: "MoviePlex" },
  { full: "MGM+Drive-In(MGMDRV).us", clean: "MGM+Drive-In" },
  { full: "MGM+HD(MGMHD).us", clean: "MGM+HD" },
  { full: "MGM+Hits(MGMHIT).us", clean: "MGM+Hits" },
  { full: "SonyMovieChannel(SONY).us", clean: "SonyMovieChannel" },
  { full: "TheMovieChannel(TMC).us", clean: "TheMovieChannel" }
];

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
const isSport = title => /\b(NFL|NBA|MLB|NHL)\b/i.test(title);
const isMovie = title => !/S\d+E\d+/i.test(title);
const extractSeasonEpisode = desc => {
  const match = desc.match(/S(\d+)E(\d+)/i);
  if (match) return `S${parseInt(match[1])}E${parseInt(match[2])}`;
  return '';
};

// Map full channel IDs to clean names
const channelMap = CHANNELS.reduce((acc, ch) => {
  acc[ch.full] = ch.clean;
  return acc;
}, {});

async function run() {
  try {
    console.log('Downloading original EPG...');
    const response = await axios.get(EPG_URL, { responseType: 'arraybuffer' });
    const decompressed = zlib.gunzipSync(response.data).toString();

    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
    const xml = await parser.parseStringPromise(decompressed);

    // Loop over all programmes
    xml.tv.programme.forEach(p => {
      const channelId = p.$.channel;
      if (!channelMap[channelId]) return; // skip unwanted channels

      // Ensure title & desc exist
      if (!p.title) p.title = [{}];
      if (!p.desc) p.desc = [{}];

      let originalTitle = p.title[0]?._ || '';
      let description = p.desc[0]?._ || '';
      let cleanedTitle = cleanTitle(originalTitle);
      const start = p.$.start;
      const airdate = start ? formatDate(start) : '';

      if (isSport(cleanedTitle)) {
        const teams = cleanedTitle.replace(/\b(NFL|NBA|MLB|NHL|Football|Basketball|Hockey|Baseball|Game)\b/gi, '').trim();
        p.title[0]._ = teams;
        p.desc[0]._ = `${teams}. ${description}. (${airdate})`;
      } else if (isMovie(cleanedTitle)) {
        const year = start ? formatYear(start) : '';
        p.title[0]._ = cleanedTitle;
        p.desc[0]._ = `${cleanedTitle}. ${description}. (${year})`;
      } else {
        const seasonEpisode = extractSeasonEpisode(description);
        const episodeName = description.split('.')[0] || '';
        p.title[0]._ = cleanedTitle;
        p.desc[0]._ = `${episodeName} - ${seasonEpisode}. ${description}. (${airdate})`;
      }
    });

    const newXml = builder.buildObject(xml);
    const compressed = zlib.gzipSync(newXml);

    fs.mkdirSync('./public', { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, compressed);

    console.log('EPG updated and saved to', OUTPUT_FILE);
  } catch (err) {
    console.error('Error updating EPG:', err);
  }
}

run();
