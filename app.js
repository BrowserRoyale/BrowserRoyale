var user,player,players,playersDS,loaded, userId;
userId = prompt("Please enter your name", "");
players = [];
var ds = deepstream( 'localhost:6020' ).login();
function preload(){
  game.stage.disableVisibilityChange = true;
  user = ds.record.getRecord(userId);
  playersDS = ds.record.getList('players');
  playersDS.subscribe( function(playerList){
    var oldPlayerList = players.map(function(plyr){return plyr.data.name});
    playerList.forEach(function(newPlayer) {
      if(newPlayer != userId)
      {
        if(oldPlayerList.indexOf(newPlayer) == -1)
        {
          var np = ds.record.getRecord(newPlayer);
          np.whenReady(function(){
            var sprite = game.add.sprite(0,0, 'dude');
            sprite.anchor.setTo(0.5, 0.5);
            players.push({data:np, sprite:sprite});
          });
        }
      }
    });
    players = players.filter(function(plyr){
      return playerList.indexOf(plyr.data.name) < 0;
    });
  });
  playersDS.whenReady(function(){
    playersDS.addEntry(userId);
    playersDS.getEntries().forEach( function( id, obj ) {
      if(id != userId)
      {
        var enemy = ds.record.getRecord( id );
        enemy.whenReady( function(){
            var pos = enemy.get('position');
            if(!pos)
              pos={x:0,y:0};
            var sprite = game.add.sprite(pos.x, pos.y, 'dude');
            sprite.anchor.setTo(0.5, 0.5);
            players.push({data:enemy, sprite:sprite});
        });
      }
    });
  });
  game.load.spritesheet('dude', 'assets/dude.png', 37, 45, 18);
}
function create(){
  user.whenReady(function(){

    var pos = user.get('position');
    if(pos)
    {
      player.x = pos.x;
      player.y = pos.y;
      //player.rotation = pos.rotation;
    }
    loaded = true;
  });
  player = game.add.sprite(200, 200, 'dude');
  player.anchor.setTo(0.5, 0.5);
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  //load user position




}
function update(){
  if(!loaded)
    return

  //update position of player
  player.body.velocity.x = 0;
  player.body.velocity.y = 0;
  player.body.angularVelocity = 0;
  player.rotation = game.physics.arcade.angleToPointer(player);
  if (game.input.keyboard.isDown(Phaser.Keyboard.UP))
  {
      game.physics.arcade.velocityFromAngle(player.angle, 300, player.body.velocity);
  }
  else{
    player.angularVelocity = 0;
  }
  //perist location of player
  user.set('position',{x:player.x,y:player.y,rotation:player.rotation});

  players.forEach(function(enemy){
    if(!enemy.sprite)
    {
      enemy.sprite = game.add.sprite(200, 200, 'dude');
    }
    if(enemy.data && enemy.sprite)
    {
      var pos = enemy.data.get('position');
      if(!pos)
        pos={x:0,y:0};
      enemy.sprite.x = pos.x;
      enemy.sprite.y = pos.y;
    }
  });
}
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

window.onbeforeunload = function (event) {
  playersDS.unsubscribe();
  playersDS.removeEntry(user.name);
  user.discard();
  user.delete();
};
