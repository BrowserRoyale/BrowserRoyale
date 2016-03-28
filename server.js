
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var tickrate = 33;
var players = {};
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Send to Everyone on channel test123
setInterval(function() {
  io.sockets.emit('server-tick', players );
}, tickrate );

io.on('connection', function(socket){
  var id = socket.id;
  socket.emit('connected',id);
  console.log('a user connected');
  socket.on('disconnect', function(){
    players[socket.id] = undefined;
  });
  socket.on('client-tick',function(data){
    players[socket.id] = data;
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
