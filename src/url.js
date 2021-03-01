const devurl = 'http://localhost:' + (process.env.PORT || 3000) + "/"; // 3000 for local. 3001 for docker container
const productionurl = 'https://www.minipost.tv/';
const currentrooturl =  devurl;

export default currentrooturl;
