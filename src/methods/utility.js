let debounce = function(a, b, c) {
    var d,e;return function(){function h(){d=null,c||(e=a.apply(f,g))}var f=this,g=arguments;return clearTimeout(d),d=setTimeout(h,b),c&&!d&&(e=a.apply(f,g)),e}
};

/** Fisher-Yates shuffle https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array */
let shuffleArray = function(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

// Parses article id and any other uuid with 8, 4, 4, 4, 12 pattern: 0f64db58-1451-4931-bb55-434013efd774
let parseId = function(encode, id) {
    if (encode) {
        id = id.replace(/[-]/g, '');
    } else {
        for (let i = 0; i < id.length; i++) {
            if (i == 7 || i == 11 || i == 15 || i == 27) {
                id.splice(i, 0, "-");
            }
        }
    }
    return id;
}

/* Simplifies time format 00/00/0000, 0:00:00 AM to 00/00/00, 0:00 am */
let roundTime = function(time) {
    if (time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)) {
        if (time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[1] && time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[2]) {
            return time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[1] + " " + time.match(/([a-zA-Z0-9].*)[:].*([a-zA-Z].)/)[2].toLowerCase();
        } else {
            return time;
        }
    } else {
        return time;
    }
    return time;
}

module.exports = {
    debounce: debounce,
    shuffleArray: shuffleArray,
    parseId: parseId,
    roundTime: roundTime
}
