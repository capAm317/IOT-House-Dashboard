// controller.js
var sys = require('util');
var net = require('net');
var mqtt = require('mqtt');
var nodemailer = require('nodemailer');
var client = mqtt.connect({host: '10.200.180.253', port: 1883});
var io = require('socket.io').listen('5000');
var serialport = require('serialport');
var serialPort2 = new serialport("COM5", {
  baudrate: 9600,
  parser: serialport.parsers.readline("\n")
});

// Require modules
var express = require('express'); //express module must be installed using NPM
var app = express(); //create app

var garageState = ''  
var connected = false

var prevA;
var curA;
var cpir = 0;



// create reusable transporter object using the default SMTP transport
//var transporter = nodemailer.createTransport('smtps://steve.cawright317%40gmail.com:Mspcacs713@smtp.gmail.com');

// // setup e-mail data with unicode symbols
// var mailOptions = {
//     from: '"Steven Ramos" <steve.cawright317@gmail.com>', // sender address
//     to: 'Marcus Ramos, stevenmarcusramos@gmail.com', // list of receivers
//     subject: 'Node Heartbeat Status', // Subject line
//     text: 'Good Day, We would like to inform you that your node is currently inactive', // plaintext body
//     html: '<b>Hello world 🐴</b>' // html body
// };

var router = express.Router();
app.use('/sayHello', router);
router.post('/', handleSayHello); // handle the route at yourdomain.com/sayHello

function handleSayHello(req, res) {
    // Not the movie transporter!
    var transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'stevenmarcusramos@gmail.com', // Your email id
            pass: 'capam1918' // Your password
        }
    });

    var text = 'Hello world from \n\n' + req.body.name;

    var mailOptions = {
	    from: 'stevenmarcusramos@gmail.com', // sender address
	    to: 'steven_ramos@dlsu.edu.ph', // list of receivers
	    subject: 'Your Node is live', // Subject line
	    text: text //, // plaintext body
	    // html: '<b>Hello world ✔</b>' // You can choose to send an HTML body instead
	};

	transporter.sendMail(mailOptions, function(error, info){
	    if(error){
	        console.log(error);
	        res.json({yo: 'error'});
	    }else{
	        console.log('Message sent: ' + info.response);
	        res.json({yo: info.response});
	    };
	});
}

io.sockets.on('connection', function (socket) {
    // socket connection indicates what mqtt topic to subscribe to in data.topic
    socket.on('subscribe', function (data) {
        console.log('Subscribing to '+data.topic);
        socket.join(data.topic);
        client.subscribe(data.topic);
    });
    // when socket connection publishes a message, forward that message
    // the the mqtt broker
    socket.on('publish', function (data) {
        console.log('Publishing to '+data.topic);
        client.publish(data.topic,data.payload);
    });
});
 
// listen to messages coming from the mqtt broker
client.on('message', function (topic, payload, packet) {
    console.log(topic+'='+payload);
    io.sockets.emit('mqtt',{'topic':String(topic),
                            'payload':String(payload)});
});

client.on('connect', () => {  
  client.subscribe('/G405/sensor/temp')
  client.subscribe('/G405/sensor/humidity')
  client.subscribe('/G405/sensor/PIR')
  client.subscribe('/G405/sensor/heartbeat')
})

client.on('message', (topic, message) => {  
  if(topic === '/G405/sensor/temp') {
    connected = (message.toString() === 'true');
    console.log("Temp: " + message.toString());
  }
  else if(topic === '/G405/sensor/humidity') {
    connected = (message.toString() === 'true');
    console.log("Humidity: " + message.toString());
  }
  else if(topic === '/G405/sensor/PIR') {
    connected = (message.toString() === 'true');
    console.log("PIR: " + message.toString());
    cpir = message.toString();

  }
  else if(topic === '/G405/sensor/heartbeat') {
  	console.log("yoh");
    console.log("Heartbeat: " + message.toString());
    curA = message.toString();
  }
})

serialPort2.on("open", function () {
  console.log('open');
  serialPort2.on('data', function(data) {
    console.log(data);
    serialPort2.write(cpir);
  	console.log("written");
  });
});


var path = require('path'); //built in path module, used to resolve paths of relative files
var port = 3000 //stores port number to listen on

app.use(express.static(path.join(__dirname + '/assets'))); //allows html file to reference stylesheet "helloworld.css" that is stored in ./css directory

app.get('/', function(req, res) { //on html request of root directory, run callback function
    res.sendFile(path.join(__dirname, '/index.html')); //send html file named "helloworld.html"
});

app.listen(port);//listen for network traffic on port specified by port variable

console.log("Now listening on port " + port); //write to the console which port is being used






