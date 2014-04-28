module('PosterImage');

test('should update the poster source', function(){
  var player, posterImage, posterEl, poster1, poster2;

  poster1 = 'http://example.com/poster.jpg';
  poster2 = 'http://example.com/UPDATED.jpg';

  player = PlayerTest.makePlayer({ poster: poster1 });

  posterImage = new vjs.PosterImage(player);
  posterEl = posterImage.el();

  // check alternative methods for displaying the poster
  function checkPosterSource(src) {
    var modern, oldIE;

    // in modern browsers we use backgroundImage to display the poster
    modern = posterEl.style.backgroundImage.toString().indexOf(src) !== -1;
    // otherwise we create an image elemement
    oldIE = posterEl.firstChild && posterEl.firstChild.src === src;

    if (modern || oldIE) {
      return true;
    }
    return false;
  }

  ok(checkPosterSource(poster1), 'displays the correct poster');

  posterImage.src(poster2);
  ok(checkPosterSource(poster2), 'displays the correct poster after updating');

  posterImage.src();
  ok(checkPosterSource(poster2), 'doesnt change poster when attempting a get');

  player.dispose();
});
