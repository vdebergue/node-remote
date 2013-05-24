// Generated by CoffeeScript 1.6.2
(function() {
  var ActionMessage, AuthentificationMessage, Message,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  $(document).ready(function() {
    var displayDevices, getTarget, sendCommand, socket, updateNowPlaying, user;

    if (window.MozWebSocket) {
      window.WebSocket = window.MozWebSocket;
    }
    socket = new WebSocket("ws://remotecontrol.azurewebsites.net");
    user = "Vince";
    socket.onopen = function() {
      var auth;

      auth = new AuthentificationMessage("", {
        user: user
      });
      return socket.send(auth.stringify());
    };
    socket.onmessage = function(message) {
      var msgObj;

      console.log(message.data);
      msgObj = JSON.parse(message.data);
      if (msgObj.type === "Status") {
        updateNowPlaying(msgObj.from, msgObj.data);
      }
      if (msgObj.type === "DevicesList") {
        return displayDevices(msgObj.data.devices);
      }
    };
    sendCommand = function(command) {
      var action, data, target;

      if (socket.readyState === WebSocket.OPEN) {
        data = {
          action: command
        };
        target = getTarget();
        if (!target) {
          alert("Select a device");
          return;
        }
        action = new ActionMessage("", target, data);
        console.log(action);
        return socket.send(action.stringify());
      }
    };
    getTarget = function() {
      return $("input[name='target']:checked").val();
    };
    displayDevices = function(devices) {
      var $devices, device, html, htmlInput, playingHtml, _i, _len;

      $devices = $("#devices");
      $devices.html("");
      htmlInput = "";
      playingHtml = "";
      for (_i = 0, _len = devices.length; _i < _len; _i++) {
        device = devices[_i];
        htmlInput += "<input type='radio' name='target' value='" + device + "' id='device_" + device + "' > Device n° " + device + "</input>";
        if ($("#playing_" + device).length === 0) {
          html = "<div class=\"playing\" id=\"playing_" + device + "\">\n    <label for=\"device_" + device + "\">\n        <p class=\"name\">...</p>\n        <p class=\"artist\">...</p>\n        <p class=\"album\">...</p>\n        <img class=\"img\" src=\"/images/media-missing.png\" />\n    </label>\n</div>";
          playingHtml += html;
        } else {
          playingHtml += ("<div class='playing' id='playing_" + device + "'>") + $("#playing_" + device).html() + "</div>";
        }
      }
      $("#playing").html(playingHtml);
      return $devices.html(htmlInput);
    };
    updateNowPlaying = function(from, data) {
      var root;

      if (!data.state) {
        root = $("#playing_" + from);
        root.find(".name").html(data.name);
        root.find(".album").html(data.album);
        root.find(".artist").html(data.artist);
        return root.find("img").attr("src", data.image);
      }
    };
    $("#previous").on("click", function() {
      return sendCommand("previous");
    });
    $("#play").on("click", function() {
      return sendCommand("play");
    });
    return $("#next").on("click", function() {
      return sendCommand("next");
    });
  });

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

    function AuthentificationMessage(from, data) {
      AuthentificationMessage.__super__.constructor.call(this, "AuthentificationRemote", from, "server", data);
    }

    return AuthentificationMessage;

  })(Message);

  ActionMessage = (function(_super) {
    __extends(ActionMessage, _super);

    function ActionMessage(from, to, data) {
      ActionMessage.__super__.constructor.call(this, "Action", from, to, data);
    }

    return ActionMessage;

  })(Message);

}).call(this);

/*
//@ sourceMappingURL=client.map
*/
