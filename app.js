var game = new Phaser.Game(800, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var platforms;
var player;
var cursors;
var stars;
var score = 0,
    scoreText;

//Multiplayer variables
var
  ds,
  guid,
  players = [];

ds = deepstream( 'localhost:6020' ).login();

//Helper functions
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function preload() {

      game.load.image('sky', 'assets/sky.png');
      game.load.image('ground', 'assets/platform.png');
      game.load.image('star', 'assets/star.png');
      game.load.spritesheet('dude', 'assets/dude.png', 32, 48);

      game.stage.disableVisibilityChange = true;
      game.time.advancedTiming = true;

}

function create() {

      //  We're going to be using physics, so enable the Arcade Physics system
      game.physics.startSystem(Phaser.Physics.ARCADE);
      //  A simple background for our game
      game.add.sprite(0, 0, 'sky');

      //  The platforms group contains the ground and the 2 ledges we can jump on
      platforms = game.add.group();
      //  We will enable physics for any object that is created in this group
      platforms.enableBody = true;

      // Here we create the ground.
      var ground = platforms.create(0, game.world.height - 64, 'ground');
      //  Scale it to fit the width of the game (the original sprite is 400x32 in size)
      ground.scale.setTo(2, 2);
      //  This stops it from falling away when you jump on it
      ground.body.immovable = true;

      //  Now let's create two ledges
      var ledge = platforms.create(400, 400, 'ground');
      ledge.body.immovable = true;
      ledge = platforms.create(-150, 250, 'ground');
      ledge.body.immovable = true;

      // The player and its settings
      player = game.add.sprite(32, game.world.height - 150, 'dude');

      //  We need to enable physics on the player
      game.physics.arcade.enable(player);

      //  Player physics properties. Give the little guy a slight bounce.
      player.body.bounce.y = 0.2;
      player.body.gravity.y = 300;
      player.body.collideWorldBounds = true;

      //  Our two animations, walking left and right.
      player.animations.add('left', [0, 1, 2, 3], 10, true);
      player.animations.add('right', [5, 6, 7, 8], 10, true);
      player.body.gravity.y = 400;

      stars = game.add.group();

      stars.enableBody = true;

      //  Here we'll create 12 of them evenly spaced apart
      for (var i = 0; i < 12; i++)
      {
          //  Create a star inside of the 'stars' group
          var star = stars.create(i * 70, 0, 'star');

          //  Let gravity do its thing
          star.body.gravity.y = 50;

          //  This just gives each star a slightly random bounce value
          star.body.bounce.y = 0.7 + Math.random() * 0.2;
      }

      //Setup keyboard
      cursors = game.input.keyboard.createCursorKeys();

      //Create score
      scoreText = game.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#000' });

      var hasGuid = false;

      if(localStorage.getItem('player-guid')) {
        guid = localStorage.getItem('player-guid');
        hasGuid = true;
      } else {
        //Generate a guid
        guid = guid();

        //Store the guid to localstorage for reconnecting afterwards
        localStorage.setItem('player-guid', guid);
      }

      // Setup deepstream
      var playersDs = ds.record.getList( 'players' );

      playersDs.whenReady(function() {
        if(!hasGuid) {
          //Add our own entry
          playersDs.addEntry(guid);
        }
        ds.record.getRecord( guid).set({position: { x: 32, y: player.position.y } });

        //Add other players
        playersDs.getEntries().forEach(function( id ) {
          playersG = game.add.group();
          var player = ds.record.getRecord(id);
          player.whenReady(function() {
            playerId = player.name;
            player = player.get();
            //Add the player to the game with a name of the record id
            var playerCreated = playersG.create(player.position.x, player.position.y, 'dude');
            playerCreated.id = playerId;
            players.push(playerCreated);
            console.log(players);
          });
        });

        player.id = guid;
        players.push(player);
        console.log(players);


      });


}

function update() {

    //  Collide the player and the stars with the platforms
    game.physics.arcade.collide(player, platforms);

    //  Reset the players velocity (movement)
    player.body.velocity.x = 0;

    if (cursors.left.isDown)
    {
        //  Move to the left
        player.body.velocity.x = -150;

        player.animations.play('left');
    }
    else if (cursors.right.isDown)
    {
        //  Move to the right
        player.body.velocity.x = 150;

        player.animations.play('right');
    }
    else
    {
        //  Stand still
        player.animations.stop();

        player.frame = 4;
    }

    //  Allow the player to jump if they are touching the ground.
    if (cursors.up.isDown && player.body.touching.down)
    {
        player.body.velocity.y = -350;
    }

    //Collide the stars
    game.physics.arcade.collide(stars, platforms);

    //See if the player overlaps a star
    game.physics.arcade.overlap(player, stars, collectStar, null, this);

    if(players) {
      //Get coords of other players and update them
      players.forEach(function (player, i) {
        var playerRecord = ds.record.getRecord(player.id)
         players.filter(function(player) {
          if(player.id == playerRecord.name && player.id !== guid) {
            players[i].position.x = playerRecord.get().position.x;
            players[i].position.y = playerRecord.get().position.y;
          }
        });
      })
    }

    //Update our position to the server
    var ourPlayer = ds.record.getRecord(guid);
    ourPlayer.set({ position: {x: player.position.x, y: player.position.y }});


    game.debug.text(game.time.fps || '--', 2, 14, "#00ff00");

}

function collectStar(player, star) {
  star.kill();
  //  Add and update the score
  score += 10;
  scoreText.text = 'Score: ' + score;
}