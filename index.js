// Import all the packages
import { login } from 'masto';
import * as dotenv from 'dotenv';
dotenv.config();
import axios from 'axios';

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
  const menuju = new Date("Mar 23, 2023 18:00:00").getTime();
  const sekarang = new Date().getTime();
  const selisih = menuju - sekarang;
  
  // 1000 mili detik = 1 detik , 60 detik = 1 menit , 60 menit = 1 jam , 24 jam  = 1 hari
  const hariMundur = Math.floor(selisih / (1000 * 60 * 60 * 24));
  const jamMundur = Math.floor(selisih % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
  const menitMundur = Math.floor(selisih % (1000 * 60 * 60 ) / (1000 * 60));
  const detikMundur = Math.floor(selisih % (1000 * 60 ) / 1000);

  return [hariMundur, jamMundur, menitMundur, detikMundur];
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

// Function to trim long text
let trimString = function(string, length) {
  return string.length > length ?
    string.substring(0, length) + '..' :
    string;
};

// Update profile
async function updateProfile(names) {
  await masto.v1.accounts
  .updateCredentials({
    displayName: names,
    //note: 'Hi fediverse!',
    // See `create-new-status-with-image.ts` example for this field.
    // avatar: new Blob([await fs.readFile('../some_image.png')]),
  })
  .then(() => {
    console.log('Masto name: ' + names);
    console.log('Profile bio updated!');
  })
}

async function fetchData() {
  const promiseArray = [];

  promiseArray.push(nowPlaying());
  promiseArray.push(getRecentTitle());
  promiseArray.push(getRecentArtist());

  Promise.all(promiseArray);
}

// Starter
keepAlive(); // for uptimerobot webserver
fetchData();

// Set loop interval every millisec
setInterval(() => {
  fetchData();
}, 60000);


// const status = await masto.v1.statuses.create({
//   status: 'Aww yeah, closing the week exploring something new. I still have no idea what I would want to build with the Mastodon API, but maybe something comes up as I play with it a bit 📖',
//  visibility: 'public',
// });


//console.log(newProfile);
//console.log(status.url);
// NowPlaying: MALIQ & D'Essen...