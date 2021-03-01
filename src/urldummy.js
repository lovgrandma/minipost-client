/* Create a url.js file in this directory with this format

These are local variables that determine how the front end interacts with the backend or where the app is located in the network */

const devurl = 'http://localhost:' + (process.env.PORT || 3000) + "/"; // 3000 for local. 3001 for docker container
const productionurl = 'https://www.minipost.app/'; // This is the production url. This can just be for reference
const currentrooturl =  devurl;

export default currentrooturl;