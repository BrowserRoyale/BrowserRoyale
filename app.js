var game,user,player,enemies,tickRate,playersDS, userId;
enemies = {};
tickRate = 33;
function preload(){
  game.stage.disableVisibilityChange = true;
  game.load.spritesheet('dude', 'assets/dude.png', 37, 45, 18);
  game.time.advancedTiming = true;
}
function create(){
  player = game.add.sprite(200, 200, 'dude');
  player.anchor.setTo(0.5, 0.5);
  game.physics.startSystem(Phaser.Physics.ARCADE);
  game.physics.enable(player, Phaser.Physics.ARCADE);
}
function update(){
  //update position of player
  player.body.velocity.x = 0;
  player.body.velocity.y = 0;
  player.body.angularVelocity = 0;
  player.rotation = game.physics.arcade.angleToPointer(player);
  game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");
  if (game.input.keyboard.isDown(Phaser.Keyboard.UP))
  {
      game.physics.arcade.velocityFromAngle(player.angle, 300, player.body.velocity);
  }
  else if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN))
  {
      game.physics.arcade.velocityFromAngle(player.angle, -300, player.body.velocity);
  }
  else if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT))
  {
      game.physics.arcade.velocityFromAngle(player.angle + 90, 300, player.body.velocity);
  }
  else if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT))
  {
      game.physics.arcade.velocityFromAngle(player.angle + 90, -300, player.body.velocity);
  }
  else{
    player.angularVelocity = 0;
  }
}
var socket = io('localhost:3000');
game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });
socket.on('connected',function(data){
  userId=data;
  setInterval(function(){
    socket.emit('client-tick',{x:player.x,y:player.y,v:player.body.velocity,a:player.angle});
  },tickRate);
});
socket.on('server-tick',function(data){
  updatePlayers(data);
});
function updatePlayers(serverData){
  for(var propt in enemies){
    //if the enemy is not in serverdata it needs to be removed
    if(!serverData[propt])
    {
      enemies[propt].destroy();
      delete enemies[propt];
    }
  }
  for(var propt in serverData){
    if(propt == userId)
      continue;
    if(!enemies[propt])
    {
      enemies[propt] = game.add.sprite(serverData[propt].x, serverData[propt].y, 'dude');
      enemies[propt].anchor.setTo(0.5, 0.5);
      game.physics.enable(enemies[propt], Phaser.Physics.ARCADE);
    }
    enemies[propt].x = serverData[propt].x;
    enemies[propt].y = serverData[propt].y;
    enemies[propt].angle = serverData[propt].a;
    if(serverData[propt].v)
      enemies[propt].body.velocity = serverData[propt].v;
  }
}