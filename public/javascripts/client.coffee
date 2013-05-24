$(document).ready( () ->
    if window.MozWebSocket 
        window.WebSocket = window.MozWebSocket

    socket = new WebSocket("ws://remotecontrol.azurewebsites.net")
    user = "Vince"

    socket.onopen = () ->
        auth = new AuthentificationMessage("", user : user)
        socket.send(auth.stringify())

    socket.onmessage = (message) ->
        console.log(message.data)
        msgObj = JSON.parse(message.data)
        if msgObj.type == "Status"
            updateNowPlaying(msgObj.from, msgObj.data)
        if msgObj.type == "DevicesList"
            displayDevices(msgObj.data.devices)


    sendCommand = (command) ->
        if socket.readyState == WebSocket.OPEN
            data = action : command
            target = getTarget()
            if not target
                alert "Select a device"
                return
            action = new ActionMessage("", target , data)
            console.log(action)
            socket.send(action.stringify());

    getTarget = () ->
        $("input[name='target']:checked").val()

    displayDevices = (devices) ->
        $devices = $("#devices")
        $devices.html("")
        htmlInput = ""
        playingHtml = ""
        for device in devices
            htmlInput += "<input type='radio' name='target' value='#{device}' id='device_#{device}' > Device n° #{device}</input>"

            # now playing
            if $("#playing_" + device).length == 0
                # new device
                html = """
                    <div class="playing" id="playing_#{device}">
                        <label for="device_#{device}">
                            <p class="name">...</p>
                            <p class="artist">...</p>
                            <p class="album">...</p>
                            <img class="img" src="/images/media-missing.png" />
                        </label>
                    </div>
                    """
                playingHtml += html
            else 
                playingHtml += "<div class='playing' id='playing_#{device}'>" + 
                    $("#playing_" + device).html() +
                    "</div>"

        $("#playing").html(playingHtml)
        $devices.html(htmlInput)

    updateNowPlaying = (from, data) ->
        if not data.state
            root = $("#playing_" + from)
            root.find(".name").html(data.name)
            root.find(".album").html(data.album)
            root.find(".artist").html(data.artist)
            root.find("img").attr("src", data.image)

    # Bindings
    $("#previous").on("click", () -> 
        sendCommand("previous")
    )
    $("#play").on("click", () -> 
        sendCommand("play")
    )
    $("#next").on("click", () -> 
        sendCommand("next")
    )
)

class Message
    constructor: (@type, @from, @to, @data) ->
    stringify: () -> JSON.stringify(@)
        
class AuthentificationMessage extends Message
    constructor: (from, data) ->
        super("AuthentificationRemote", from, "server", data)

class ActionMessage extends Message
    constructor: (from, to, data) ->
        super("Action", from, to, data)