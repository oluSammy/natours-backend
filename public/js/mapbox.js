/*eslint-disable */

console.log('Hello node dev');
const locations = JSON.parse(document.getElementById('map').dataset.locations);
console.log(locations);


mapboxgl.accessToken = 'pk.eyJ1Ijoib2x1c2FtYXlvciIsImEiOiJja21odzY1NWEwYmQyMnVtcW44bmFoZzVlIn0.M48bssR6x6y2QBgwMSI1yw';
var map = new mapboxgl.Map({
container: 'map',
style: 'mapbox://styles/mapbox/streets-v11'
});