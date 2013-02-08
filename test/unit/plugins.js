module('Plugins');

test('Plugin should get initialized and receive options', function(){
  expect(2);

  vjs.plugin('myPlugin1', function(options){
    ok(true, 'Plugin initialized');
    ok(options['test'], 'Option passed through');
  });

  vjs.plugin('myPlugin2', function(options){
    ok(false, 'Plugin initialized and should not have been');
  });

  var player = PlayerTest.makePlayer({
    'plugins': {
      'myPlugin1': {
        'test': true
      }
    }
  });

  player.dispose();
});

test('Plugin should have the option of being initilized outside of player init', function(){
  expect(3);

  vjs.plugin('myPlugin3', function(options){
    ok(true, 'Plugin initialized after player init');
    ok(options['test'], 'Option passed through');
  });

  var player = PlayerTest.makePlayer({});

  ok(player['myPlugin3'], 'Plugin has direct access on player instance');

  player['myPlugin3']({
    'test': true
  });

  player.dispose();
});

test('Plugin should be able to add a UI component', function(){
  expect(2);

  vjs.plugin('myPlugin4', function(options){
    ok((this instanceof vjs.Player), 'Plugin executed in player scope by default');
    this.addChild('component');
  });

  var player = PlayerTest.makePlayer({});
  player['myPlugin4']({
    'test': true
  });

  var comp = player.getChild('component');
  ok(comp, 'Plugin added a component to the player');

  player.dispose();
});

test('Plugin should overwrite plugin of same name', function(){
  var v1Called = 0,
      v2Called = 0,
      v3Called = 0;

  // Create initial plugin
  vjs.plugin('myPlugin5', function(options){
    v1Called++;
  });
  var player = PlayerTest.makePlayer({});
  player['myPlugin5']({});

  // Overwrite and create new player
  vjs.plugin('myPlugin5', function(options){
    v2Called++;
  });
  var player2 = PlayerTest.makePlayer({});
  player2['myPlugin5']({});

  // Overwrite and init new version on existing player
  vjs.plugin('myPlugin5', function(options){
    v3Called++;
  });
  player2['myPlugin5']({});

  var comp = player.getChild('component');
  ok(v1Called === 1, 'First version of plugin called once');
  ok(v2Called === 1, 'Plugin overwritten for new player');
  ok(v3Called === 1, 'Plugin overwritten for existing player');

  player.dispose();
  player2.dispose();
});

