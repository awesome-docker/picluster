var http = require('http');
var net = require('net');
var port =  process.env.PORT;
var express = require('express');
var dockerFolder = process.env.DOCKER;
var agentPort = process.env.AGENTPORT;
var request = require('request');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser());
require('request-debug')(request);
var fs = require('fs');
var exec = require('child_process').exec;
var config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
var server = require("http").createServer(app);
var logFile = './log.txt';
var log = '';

app.get('/status', function(req, res){
  var command = JSON.stringify({ "command": 'docker ps' });
  for(var i = 0; i < config.layout.length; i++) {
    var node = config.layout[i].node;
    var responseString = '';

    //Runs a command on each node
    var options = {
      url: 'http://' + node + ':' + agentPort + '/run',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command
    }

    request(options, function(error, response, body) {
      if (error) {
        res.end("An error has occurred.");
      } else {
        var results = JSON.parse(response.body);
        addLog('\n\n\n' + results.output);
      }
    })

  }
  res.end('');
});


function addLog(data){
  log += data;
  fs.appendFile(logFile, log, function(err) {
    if(err) {
      console.log('\nError while adding data to the log' + err);
    }
  });
  log = '';
}

app.get('/build', function(req, res){
  var responseString = '';
  for(var i = 0; i < config.layout.length; i++) {
    var node = config.layout[i].node;
    for (var key in config.layout[i]) {
      if (config.layout[i].hasOwnProperty(key)) {    //Builds the required images on each host
        if(key.indexOf("node") > -1){
console.log('\nDEbug:' + key);
        } else {
        var command = JSON.stringify({ "command": 'docker build ' + dockerFolder + '/' + key + ' -t ' + key + ' -f ' + dockerFolder + '/' + key + '/Dockerfile'});

        var options = {
          url: 'http://' + node + ':' + agentPort + '/run',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': command.length
          },
          body: command
        }

        request(options, function(error, response, body) {
          if (error) {
            res.end("An error has occurred.");
          } else {
            var results = JSON.parse(response.body);
            addLog('\n' + results.output);
          }
        })
      }
      }
    }
  }
  res.end('');
});


app.get('/create', function(req, res){
  var responseString = '';
  for(var i = 0; i < config.layout.length; i++) {
    var node = config.layout[i].node;
    for (var key in config.layout[i]) {
      if (config.layout[i].hasOwnProperty(key)) {
        //Creates and runs the Docker images assigned to each host.
        var command = JSON.stringify({ "command": 'docker run -d --name ' + key +  ' ' + config.layout[i][key]});
        var options = {
          hostname: node,
          port    : agentPort,
          path    : '/run',
          method  : 'POST',
          headers : {
            'Content-Type': 'application/json',
            'Content-Length': command.length
          }
        }
        var request = http.request(options, function(response){
          response.on('data', function(data) {
            responseString += data;
          });
          response.on('end', function(data){
            if(!responseString.body) {

            } else {
              var results = JSON.parse(body.toString("utf8"));
              addLog(results.output);
            }

          });
        }).on('error', function(e) {
          console.error(e);
        });
        request.write(command);
        req.end;
      }
    }
  }
  res.end('');
});

app.get('/start', function(req, res){
  var responseString = '';
  for(var i = 0; i < config.layout.length; i++) {
    var node = config.layout[i].node;
    for (var key in config.layout[i]) {
      if (config.layout[i].hasOwnProperty(key)) {
        //Starts the Docker images assigned to each host.

        var command = JSON.stringify({ "command": 'docker start ' + key});
        var options = {
          hostname: node,
          port    : agentPort,
          path    : '/run',
          method  : 'POST',
          headers : {
            'Content-Type': 'application/json',
            'Content-Length': command.length
          }
        }
        var request = http.request(options, function(response){
          response.on('data', function(data) {
            responseString += data;
          });
          response.on('end', function(data){
            if(!responseString.body) {

            } else {
              var results = JSON.parse(body.toString("utf8"));
              addLog(results.output);
            }
          });
        });
        request.write(command);
        req.end;
      }
    }
  }
  res.end('');
});

app.get('/stop', function(req, res){
  var responseString = '';
  for(var i = 0; i < config.layout.length; i++) {
    var node = config.layout[i].node;
    for (var key in config.layout[i]) {
      if (config.layout[i].hasOwnProperty(key)) {

        //Starts the Docker images assigned to each host.
        var command = JSON.stringify({ "command": 'docker stop ' + key});
        var options = {
          hostname: node,
          port    : agentPort,
          path    : '/run',
          method  : 'POST',
          headers : {
            'Content-Type': 'application/json',
            'Content-Length': command.length
          }
        }
        var request = http.request(options, function(response){
          response.on('data', function(data) {
            responseString += data;
          });
          response.on('end', function(data){
            var results = JSON.parse(responseString);
            addLog(results.output);
          });
        });
        request.write(command);
        req.end;
      }
    }
  }
  res.end('');
});

app.get('/restart', function(req, res){
  var node = req.query['node'];
  var container = req.query['container'];
  var responseString = '';
  var command = JSON.stringify({ "command": 'docker restart ' + container});

  var options = {
    hostname: node,
    port    : agentPort,
    path    : '/run',
    method  : 'POST',
    headers : {
      'Content-Type': 'application/json',
      'Content-Length': command.length
    }
  }
  var request = http.request(options, function(response){
    response.on('data', function(data) {
      responseString += data;
    });
    response.on('error', function(data) {
      responseString += data;
    });
    response.on('end', function(data){
      var results = JSON.parse(responseString);
      addLog(results.output);
    });
  });
  request.write(command);
  req.end;
  res.end('');
});



app.post('/exec', function(req, res){
  var test = '';
  var command = JSON.stringify({ "command": req.body.command });
  for(var i = 0; i < config.layout.length; i++) {
    var node = config.layout[i].node;
    var responseString = '';

    //Runs a command on each node

    var options = {
      url: 'http://' + node + ':' + agentPort + '/run',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': command.length
      },
      body: command
    }

    request(options, function(error, response, body) {
      if (response.statusCode != "200") {
        res.end("An error has occurred.");
      } else {
        var results = JSON.parse(response.body);
        addLog('\n' + results.output);
      }
    })
  }
  res.end('');
});

function hb_check(node, port, container){
  var client = new net.Socket();

  client.connect(port, node, container, function() {
  });

  client.on('error', function(data) {
    addLog('\n' + container + ' failed on: ' + node);
    var options = {
      host: '127.0.0.1',
      path: '/restart?node=' + node + '&container=' + container,
      port: port
    };

    var request = http.get(options, function(response){
    }).on('error', function(e) {
      console.error(e);
    });;;
    client.destroy();
  });

};

app.get('/hb', function(req, res){
  var responseString = '';
  var node = '';
  var port = ''
  var container = '';
  for(var i = 0; i < config.hb.length; i++) {
    for (var key in config.hb[i]) {
      if (config.hb[i].hasOwnProperty(key)) {
        container = key;
        node = config.hb[i].node;
        port = config.hb[i][key];
        if(port != node){
          hb_check(node, port, container);
        }

      }
    }
  }
  res.end('');
});

function gatherLog (callback){
  callback(log);
}

app.get('/log', function(req, res){
  res.sendFile(__dirname + '/log.txt');

});

app.get('/glusterMount', function(req, res){

});

app.get('/glusterUmount', function(req, res){

});

server.listen(port, function() {
  console.log('Listening on port %d', port);
});