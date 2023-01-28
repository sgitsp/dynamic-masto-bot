// Import all the packages
import { login } from 'masto';
import * as dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';
import fs from 'fs';
import Jimp from 'jimp';
import sharp from 'sharp';

// for replit uptimerobot
import { keepAlive } from './server.js';

// Auth Credential using Mastodon API v.1
const masto = await login({
  url: process.env.URL,
  accessToken: process.env.TOKEN,
});

// Randomize function
Array.prototype.random = function () {
  return this[Math.floor((Math.random()*this.length))];
}

// Countdown function
// Ramadan will be 23rd March 2023
function hitungMundur() {
  const timezone = 7;
  const menuju = new Date("Mar 23, 2023 18:00:00");
  const today = new Date();
  const sekarang = today.setUTCHours(today.getHours() + timezone);
  const selisih = menuju - sekarang;
  
  // 1000 mili detik = 1 detik , 60 detik = 1 menit , 60 menit = 1 jam , 24 jam  = 1 hari
  const hariMundur = Math.floor(selisih / (1000 * 60 * 60 * 24));
  const jamMundur = Math.floor(selisih % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
  const menitMundur = Math.floor(selisih % (1000 * 60 * 60 ) / (1000 * 60));
  const detikMundur = Math.floor(selisih % (1000 * 60 ) / 1000);

  return [hariMundur, jamMundur, menitMundur, detikMundur];
}

// Current dateTime function
const timezone = 7; // add 7 based on GMT+7 location

function currentTime() {
  var today = new Date();
  today.setUTCHours(today.getHours() + timezone);
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  let day = days[today.getDay()];
  let date = today.getDate();
  let month = months[today.getMonth()];
  let year = today.getFullYear();
  let fullDate = today.getDate() + " " + month + " " + today.getFullYear();

  let hours = ("0" + today.getHours()).slice(-2);
  let minutes = ("0" + today.getMinutes()).slice(-2);
  let seconds = ("0" + today.getSeconds()).slice(-2);
  let fullTime = hours + ':' + minutes;

  return [day, date, month, year, fullDate, fullTime, seconds];
}

// Hello there greeting function
async function greeting() {
  let greetingText = "";

  var today = new Date();
  today.setUTCHours(today.getHours() + timezone);
  const h = today.getHours();
  const greetingTypes = ["Selamat pagi si paling morning person...", "GM to everyone except those who never say it back!", "Hi, my day is fine just afternoon here!", "Wish y'all a relaxing evening and later a good night~", "Y'all have a good night rest..", "Nighty night, tweethearts <3", "Lingsir wengi, wayahe demit do tangi~", "Wes jam telu, wayahe demit do turu~"];

  if (h >= 3 && h < 4) { greetingText = greetingTypes[7]; } // Wes jam telu
  else if (h >= 4 && h < 6) { greetingText = greetingTypes[1]; } // si paling morning person
  else if (h >= 6 && h < 10) { greetingText = greetingTypes[1]; } // G' Morning!
  else if (h >= 10 && h < 15) { greetingText = greetingTypes[2]; } // Fine afternoon..
  else if (h >= 15 && h < 19) { greetingText = greetingTypes[3]; } // Nice Evening.
  else if (h >= 19 && h < 22) { greetingText = greetingTypes[4]; } // Prime time
  else if (h >= 22 && h < 24) { greetingText = greetingTypes[5]; } // Nighty Night!
  else greetingText = greetingTypes[6]; // Lingsir wengi~

  return greetingText;
}

// Fetch recent track from LastFM
async function getLastFm() {
  const response = await axios.get(process.env.LASTFM);
  return response;
}

// Get nowPlaying status
async function nowPlaying() {
  const [hariMundur, jamMundur, menitMundur, detikMundur] = hitungMundur();
  let nowPlaying = "";
  var title = await getRecentTitle();
  var artist = await getRecentArtist();
  await getLastFm()
    .then(response => {
      var latestTrack = response.data.recenttracks.track[0];
      // detect if the track has attributes associated with it
      var attr = latestTrack["@attr"];
      // if nowplaying attr is undefined
      if (typeof attr === 'undefined') {
        nowPlaying = ("Recently Played");
        updateProfile(["Ramadan is just " + hariMundur + " day(s) away", "Nobody Nearby"].random(2));
      } else {
        nowPlaying = ("I'm curently listening to");
        updateProfile("NowPlaying: " + artist);
      }
    })
    .catch (error => console.log(error.response.data))
  return nowPlaying;
}

// Get recent song title
async function getRecentTitle() {
  let trackTitle = ""
  await getLastFm()
    .then(response => {
      var latestTrack = response.data.recenttracks.track[0];
      trackTitle = latestTrack.name;
    })
    .catch (error => console.log(error.response.data))
  console.log('Get track title ♪');
  return trimString(trackTitle, 17);
}

// Get recent song artist
async function getRecentArtist() {
  let trackArtist = ""
  await getLastFm()
    .then(response => {
      var latestTrack = response.data.recenttracks.track[0];
      trackArtist = latestTrack.artist["#text"];
    })
    .catch (error => console.log(error.response.data))
  console.log('Get track artist ♪');
  return trimString(trackArtist, 16);
}

// Download album image
async function downloadAlbumImage() {
  await getLastFm()
    .then(response => {
      var latestTrack = response.data.recenttracks.track[0];
      const trackCover = latestTrack.image[2]["#text"];
      if (latestTrack.image[2]["#text"] === '') {
        axios({
          url: 'https://lastfm.freetls.fastly.net/i/u/300x300/c6f59c1e5e7240a4c0d427abd71f3dbb.jpg',
          responseType: 'arraybuffer',
        }).then(
          (response) =>
            new Promise((resolve, reject) => {
              resolve(sharp(response.data)
                .grayscale()
                .resize(albumWidth, albumWidth)
                .composite([{
                  input: rect,
                  blend: 'dest-in'
                }])
                .toFile(`trackCover.png`));
                console.log(`Downloading track album image..`);
            })
        ).then(() => {
          drawBanner();
        })
      } else {
        axios({
          url: trackCover,
          responseType: 'arraybuffer',
        }).then(
          (response) =>
            new Promise((resolve, reject) => {
              resolve(sharp(response.data)
                .grayscale()
                .resize(albumWidth, albumWidth)
                .composite([{
                  input: rect,
                  blend: 'dest-in'
                }])
                .toFile(`trackCover.png`));
                console.log(`Downloading track album image..`);
            })
        ).then(() => {
          drawBanner();
        })
      }
    })
    .catch (error => console.log('LastFM error:', error.response.data))
}

// Function to crop album cover
const albumWidth = 130, // album img size
  rAlbum = 8, // for border radius
  rect = Buffer.from(`<svg><rect x="0" y="0" width="${albumWidth}" height="${albumWidth}" rx="${rAlbum}" ry="${rAlbum}"/></svg>`);

// Function to trim long text
let trimString = function(string, length) {
  return string.length > length ?
    string.substring(0, length) + '..' :
    string;
};

// Update profile
async function uploadBanner() {
  const base64 = new Blob([await fs.readFileSync('1500x500.png')]);
  await masto.v1.accounts
    .updateCredentials({
      header: base64,
    })
    .then(() => {
      console.log('Upload header done!');
    });
}

async function updateProfile(names) {
  await masto.v1.accounts
  .updateCredentials({
    displayName: names,
    //header: base64,
    //note: 'Hi fediverse!',
    // See `create-new-status-with-image.ts` example for this field.
    // avatar: new Blob([await fs.readFile('../some_image.png')]),
  })
  .then(() => {
    console.log('Masto name: ' + names);
    console.log('Profile bio updated!');
  })
}

async function drawBanner() {
  const [day, date, month, year, fullDate, fullTime, seconds] = currentTime();
  const [hariMundur, jamMundur, menitMundur, detikMundur] = hitungMundur();
  const images = ['default.png', 'overlay.png', 'trackCover.png'];
  const promiseArray = [];

  const dayFont = await Jimp.loadFont('fonts/Avigea/avigea-white-72.fnt');
  const timeFont = await Jimp.loadFont("fonts/Caviar/CaviarBold-white-32.fnt");
  const monthFont = await Jimp.loadFont("fonts/CaviarDreams_white-32.ttf.fnt");
  const nowPlayingFont = await Jimp.loadFont("fonts/Caviar/CaviarBold-white-18.fnt");
  const trackTitleFont = await Jimp.loadFont("fonts/Gotham/gothamMedium-white-12.fnt");
  const trackArtistFont = await Jimp.loadFont("fonts/Gotham/gothamBook-black-12.fnt");
  
  images.forEach((image) => promiseArray.push(Jimp.read(image)));
  promiseArray.push(greeting());
  promiseArray.push(nowPlaying());
  promiseArray.push(getRecentTitle());
  promiseArray.push(getRecentArtist());

  Promise.all(promiseArray).then(
    ([banner, overlay, trackCover, greeting, nowPlaying, trackTitle, trackArtist]) => {
      banner.composite(overlay, 0, 0);
      banner.composite(trackCover, 219, 145);
      banner.print(dayFont, 0, 58, {
        text: day, // Wednesday
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 198);
      banner.print(monthFont, -0, -70, {
        text: date + ' ' + month + ' ' + year, // 17 Januari 1996
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 344);
      banner.print(timeFont, 0, 37, {
        text: fullTime,  // 14:12
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 295);
      banner.print(nowPlayingFont, 365, 80, {
        text: nowPlaying, // Recently Played
        alignmentX: Jimp.HORIZONTAL_ALIGN_LEFT,
        alignmentY: Jimp.VERTICAL_ALIGN_TOP
      }, 1385, 416);
      banner.print(trackTitleFont, -429, 87, {
        text: trackTitle, // Grey Sky Morning
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, 1424, 459);
      banner.print(trackArtistFont, -429, 95, {
        text: trackArtist, // Vertical Horizon
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE
      }, 1424, 479);
      banner.print(monthFont, 0, 170, {
        text: greeting, // Fine afternoon
        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,
        alignmentY: Jimp.VERTICAL_ALIGN_BOTTOM
      }, 1500, 282);
      console.log(greeting);
      console.log("Ramadhan is just " + hariMundur + " day(s) away");
      console.log('♫ ' + nowPlaying + ': "' + trackTitle + '" ' + 'by' + ' ' + trackArtist + ' ♫');
      banner.write('1500x500.png', function() {
        uploadBanner();
      });
      console.log(`Update on ${day} ${fullDate} at ${fullTime}:${seconds} (UTC+${timezone})`);
    }
  );
}

// Starter
keepAlive(); // for uptimerobot webserver
downloadAlbumImage();

// Set loop interval every millisec
setInterval(() => {
  downloadAlbumImage();
}, 60000);


// const status = await masto.v1.statuses.create({
//   status: 'Aww yeah, closing the week exploring something new. I still have no idea what I would want to build with the Mastodon API, but maybe something comes up as I play with it a bit 📖',
//  visibility: 'public',
// });


//console.log(newProfile);
//console.log(status.url);
// NowPlaying: MALIQ & D'Essen...