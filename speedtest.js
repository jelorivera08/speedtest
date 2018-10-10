const express = require('express');
const app = express();
const port = 3000;
const { performance } = require('perf_hooks');
const fs = require('fs');
const request = require('request');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const SIZE_OF_IMAGE = 107726177; // bytes
let stopTimeToDownload = 0;
let startTimeToDownload = 0;
let timeTakenToDownload = 0;

// we check the download speed by downloading a 100 MB image
// on the internet into our system and divide the file size
// by the time spent downloading the image
const download = (uri, filename, callback) =>
  request.head(uri, () => {
    request(uri)
      .pipe(fs.createWriteStream(filename))
      .on('close', callback);
  });

// we check the upload speed of our internet by sending a
// string with a fixed byte size to the internet
// and divide the size by the time spent sending the string
const upload = function checkUploadSpeed(update) {
  let xhr = new XMLHttpRequest();
  let url = '?cache=' + Math.floor(Math.random() * 10000);
  let data = getRandomString(30);
  let startTime;
  let speed = 0;

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      speed = (1024 * 30) / (performance.now() - startTime);
      update(speed.toFixed(2));
    }
  };

  xhr.open('POST', url, true);
  startTime = performance.now();
  xhr.send(data);
};

// randomg string generator
function getRandomString(sizeInMb) {
  var chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789~!@#$%^&*()_+`-=[]{}|;':,./<>?", //random data prevents gzip effect
    iterations = sizeInMb * 1024 * 1024, //get byte count
    result = '';
  while (iterations--) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get('/', (req, res) => {
  const interval = setInterval(
    () => console.log('getting upload and download speed...'),
    1500
  );

  startTimeToDownload = performance.now();
  download(
    'https://upload.wikimedia.org/wikipedia/commons/2/2c/A_new_map_of_Great_Britain_according_to_the_newest_and_most_exact_observations_%288342715024%29.jpg',
    '10MB_IMAGE.png',
    function() {
      stopTimeToDownload = performance.now();
      timeTakenToDownload = (stopTimeToDownload - startTimeToDownload) / 1000; // convert to seconds
      const bitsLoaded = SIZE_OF_IMAGE * 8;
      const speedBps = (bitsLoaded / timeTakenToDownload).toFixed(2);
      const speedKbps = (speedBps / 1024).toFixed(2);
      const downloadSpeedMbps = (speedKbps / 1024).toFixed(2);
      upload(uploadSpeed => {
        console.log(`
        DOWNLOAD SPEED : ${downloadSpeedMbps} Mbps
        UPLOAD SPEED : ${uploadSpeed} Mbps
        `);

        clearInterval(interval);
      });
    }
  );

  res.send('check console to see results of your speed test');
});

app.listen(port, () =>
  console.log(`Speed test app listening on port ${port}!`)
);
