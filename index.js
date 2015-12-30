var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');
var crypto = require('crypto');
var https = require('https');
var fs = require('fs');
var usertoken = new Array();
var tokentouser = new Array();
var sockettouser=new Array();
var usertosocket=new Array();
// Change this to DB
var connection = mysql.createConnection({
    host    :'localhost',
    port : 3306,
    user : 'root',
    password : '******',
    database:'hirami'
});
/* Enable this if You using SSL
var options = {
    key: fs.readFileSync('secure_cert/key.pem'),
    cert: fs.readFileSync('secure_cert/cert.pem')
};
*/
connection.connect(function(err) {
    if (err) {
        console.error('mysql connection error');
        console.error(err);
        throw err;
    }
});
function randNum(){
 var ALPHA = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','0','1','2','3','4','5','6','7','8','9'];
 var rN='';
 for(var i=0; i<8; i++){
  var randTnum = Math.floor(Math.random()*ALPHA.length);
  rN += ALPHA[randTnum];
 }
 return rN;
}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
app.get('/no-notify/', function(req, res){
  res.sendFile(__dirname + '/no-notify.html');
});
app.get('/board.txt', function(req, res){
  res.sendFile(__dirname + '/board.txt');
});
app.get('/favicon.ico', function(req, res){
  res.sendFile(__dirname + '/favicon.ico');
});
/*
Future Update
app.get('/*', function(req, res){
  res.sendFile(__dirname + "/html" + req.url);
  console.log("Request " + req.url);
});
*/

io.on('connection', function(socket){
  var address = socket.request.connection.remoteAddress.split(':')[3];

  socket.on('chat message', function(msg,token){
  	if(!token){
  		socket.emit('alert','You have to login to chat.');
  	} else {

var user=tokentouser[token];
if(msg=="/board"){
	fs.readFile('board.txt', 'utf8', function (err,data) {
  socket.emit('update_board',data);
});
	socket.emit('open_board');
	return;
}
if(msg=="/help"){
socket.emit("chat message","Currently, 1 Command(s) can use.");
socket.emit("chat message","/board: Open the WhiteBoard.");
	return;
}

	if(msg){
    io.emit('chat message', user + ": " + msg);

    socket.broadcast.emit('notify',user,msg);
    /*
    io.emit('chat_split_sender',user);
    io.emit('chat_split_msg',msg);
    */
}

}
  });
  socket.on('board_update', function(contents){
fs.writeFile("board.txt", contents, function(err) {
    if(err) {
        return console.log(err);
    }
socket.broadcast.emit('update_board',contents);
}); 
  });
  socket.on('login', function(id,pw){

  	  	var sql="SELECT * FROM system where username='" + id + "' and password='" + pw + "';"
  	connection.query(sql,function(err,rows){

  if(!rows[0]){ socket.emit('alert',"ID or PW are incorrect. Please Check!"); 
console.log(address + "Login failed");
} else {

     var user = rows[0].username;
     var password = rows[0].password;
     socket.emit('alert',"Hello, " + user);
     socket.emit('status',"logined");
     console.log(address + "is Logined.");
     // 기존토큰 파괴
console.log(usertosocket[user]);

     var oldconnect=io.to(usertosocket[user]);
     oldconnect.emit('chat message','[Notice] We detected multiple-login. this is very Experimental, So report this if found issue.');
 
     var temptoken=crypto.createHash('md5').update(randNum()).digest("hex");
     usertoken[user]=temptoken;
     tokentouser[temptoken]=user;
     sockettouser[socket.id]=id;
     usertosocket[id]=socket.id;
     socket.emit('token',temptoken);
     socket.emit('username',user);
     socket.emit('login_success');
}
  });

});
  socket.on('welcome', function(token){
  	var user=tokentouser[token];
  	console.log(user);
    io.emit('chat message',user + " joined to chat");
    socket.emit('chat message',"Hello," + user + ".");
    socket.emit('chat message',"You can view all available commands you enter /help.");
  });
  socket.on('disconnect', function(msg){
  	  	var user=sockettouser[socket.id];
  	  	if(user===undefined){
  	  	} else {
    io.emit('chat message', user + " leaved chat");
}
  });
});

http.listen(3000, function(){
  console.log('Insecure HTTP on *:3000');
});

/*
https.createServer(options,app).listen(4000, function(){
  console.log('Secure HTTPS on *:4000');
});
*/