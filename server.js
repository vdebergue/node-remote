// Generated by CoffeeScript 1.6.2
(function() {
  var AuthentificationMessage, DevicesListMessage, Message, WebSocketServer, addConnectionToUser, addr, app, connection_id, connections, connectionsByUser, express, http, originIsAllowed, path, routes, sendDeviceListToRemotes, server, wsServer,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  express = require('express');

  routes = require('./routes');

  http = require('http');

  path = require('path');

  WebSocketServer = require('websocket').server;

  app = express();

  app.set('port', process.env.PORT || 8000);

  app.set('views', __dirname + '/views');

  app.set('view engine', 'jade');

  app.use(express.favicon());

  app.use(express.logger('dev'));

  app.use(express.bodyParser());

  app.use(express.methodOverride());

  app.use(app.router);

  app.use('/public', express["static"](path.join(__dirname, 'public')));

  if ('development' === app.get('env')) {
    app.use(express.errorHandler());
  }

  app.get('/', routes.index);

  addr = app.address();

  server = http.createServer(app).listen(app.get('port'), function() {
    return console.log("Express server listening on " + addr.address + ":" + addr.port);
  });

  connections = {};

  connection_id = 0;

  connectionsByUser = {};

  addConnectionToUser = function(user, connection, isRemote) {
    connection.user = user;
    connection.isRemote = isRemote;
    if (!connectionsByUser.hasOwnProperty(user)) {
      connectionsByUser[user] = {
        devices: [],
        remotes: []
      };
    }
    if (isRemote) {
      return connectionsByUser[user]["remotes"].push(connection.id);
    } else {
      return connectionsByUser[user]["devices"].push(connection.id);
    }
  };

  originIsAllowed = function(origin) {
    console.log(origin);
    return true;
  };

  wsServer = new WebSocketServer({
    httpServer: server
  });

  wsServer.on('request', function(request) {
    var connection;

    if (!originIsAllowed(request.origin)) {
      request.reject;
    }
    connection = request.accept(null, request.origin);
    connection_id += 1;
    connections[connection_id] = connection;
    connection.id = connection_id;
    connection.on('message', function(message) {
      var conn, devices, msgObj, remoteId, resp, target, user, _i, _len, _ref, _results;

      if (message.type === 'utf8') {
        msgObj = JSON.parse(message.utf8Data);
        console.log(connection.id + " :" + message.utf8Data);
        if (msgObj.type === "Authentification") {
          user = msgObj.data.user;
          addConnectionToUser(user, connection, false);
          resp = new AuthentificationMessage(connection.id, {
            id: connection.id
          });
          connection.sendUTF(resp.stringify());
          return sendDeviceListToRemotes(msgObj.data.user);
        } else if (msgObj.type === "AuthentificationRemote") {
          user = msgObj.data.user;
          addConnectionToUser(user, connection, true);
          devices = connectionsByUser[user]["devices"];
          resp = new DevicesListMessage(connection.id, {
            devices: devices
          });
          return connection.sendUTF(resp.stringify());
        } else if (msgObj.type === "Action") {
          target = connections[msgObj.to];
          return target.sendUTF(message.utf8Data);
        } else if (msgObj.type === "Status") {
          _ref = connectionsByUser[connection.user]["remotes"];
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            remoteId = _ref[_i];
            conn = connections[remoteId];
            _results.push(conn.sendUTF(message.utf8Data));
          }
          return _results;
        }
      } else {
        return console.log("Not UTF8 message");
      }
    });
    return connection.on('close', function() {
      var array, id, index, type, user;

      user = connection.user;
      id = connection.id;
      delete connections[id];
      type = connection.isRemote ? "remotes" : "devices";
      array = connectionsByUser[user][type];
      index = array.indexOf(id);
      array.splice(index, 1);
      return sendDeviceListToRemotes(user);
    });
  });

  sendDeviceListToRemotes = function(user) {
    var conn, devices, remoteId, resp, _i, _len, _ref, _results;

    _ref = connectionsByUser[user]["remotes"];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      remoteId = _ref[_i];
      conn = connections[remoteId];
      devices = connectionsByUser[user]["devices"];
      resp = new DevicesListMessage(conn.id, {
        devices: devices,
        other: connectionsByUser
      });
      _results.push(conn.sendUTF(resp.stringify()));
    }
    return _results;
  };

  Message = (function() {
    function Message(type, from, to, data) {
      this.type = type;
      this.from = from;
      this.to = to;
      this.data = data;
    }

    Message.prototype.stringify = function() {
      return JSON.stringify(this);
    };

    return Message;

  })();

  AuthentificationMessage = (function(_super) {
    __extends(AuthentificationMessage, _super);

    function AuthentificationMessage(to, data) {
      AuthentificationMessage.__super__.constructor.call(this, "Authentification", "server", to, data);
    }

    return AuthentificationMessage;

  })(Message);

  DevicesListMessage = (function(_super) {
    __extends(DevicesListMessage, _super);

    function DevicesListMessage(to, data) {
      DevicesListMessage.__super__.constructor.call(this, "DevicesList", "server", to, data);
    }

    return DevicesListMessage;

  })(Message);

}).call(this);
