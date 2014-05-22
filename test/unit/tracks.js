module('Tracks');

test('should place title list item into ul', function() {
  var player, chaptersButton;

  player = PlayerTest.makePlayer();

  chaptersButton = new vjs.ChaptersButton(player);

  var menuContentElement = chaptersButton.el().getElementsByTagName('UL')[0];
  var titleElement = menuContentElement.children[0];

  ok(titleElement.innerHTML === 'Chapters', 'title element placed in ul');

  player.dispose();
});

test('cue time parsing', function() {
  var parse = vjs.TextTrack.prototype.parseCueTime;

  equal(parse('11:11'), 671, 'Only minutes and seconds (11:11)');
  equal(parse('11:11:11'), 40271, 'Hours, minutes, seconds (11:11:11)');
  equal(parse('11:11:11.111'), 40271.111, 'Hours, minutes, seconds, decimals (11:11:11.111)');

  // Uncommment to test a fix for #877
  // equal(parse('11:11 line:90%'), 671, 'minutes, seconds with flags');
  // equal(parse('11:11:11 line:90%'), 40271, 'hours, minutes, seconds with flags');
});

test('cue parsing', function() {
  var mockTrack = {
    cues_: [],
    reset: function(){ this.cues_ = []; },
    parseCues: vjs.TextTrack.prototype.parseCues,
    parseCueTime: vjs.TextTrack.prototype.parseCueTime,
    trigger: function(){}
  };
  var vttHead = 'WEBVTT\n\n';

  var timeWithSpaces = vttHead + '00:00.700 --> 00:04.110\nText line 1';
  mockTrack.parseCues(timeWithSpaces);
  equal(mockTrack.cues_[0].startTime, 0.7, 'Cue start time w/ spaces');
  equal(mockTrack.cues_[0].endTime, 4.11, 'Cue end time w/ spaces');
  equal(mockTrack.cues_[0].text, 'Text line 1', 'Cue text');

  // Uncomment to test a fix for #183
  // mockTrack.reset(); // reset mock track
  // var timeWithTabs = vttHead + '00:00.700\t-->\t00:04.110\nText line 1';
  // mockTrack.parseCues(timeWithTabs);
  // equal(mockTrack.cues_[0].startTime, 0.7, 'Cue start time w/ spaces');
  // equal(mockTrack.cues_[0].endTime, 4.11, 'Cue end time w/ spaces');
});
