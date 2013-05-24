express = require 'express'
routes = require './routes'
http = require 'http'
path = require 'path'
require 'express-namespace'
WebSocketServer  = require('websocket').server

app = express()

# all environments
app.set('port', process.env.PORT || 5000)
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
app.set('basepath', '/remote')
app.use(express.favicon())
app.use(express.logger('dev'))
app.use(express.bodyParser())
app.use(express.methodOverride())
app.use(app.router)
app.use('/remote/public', express.static(path.join(__dirname, 'public')))
app.enable('trust proxy')

# development only
if ('development' == app.get('env'))
    app.use(express.errorHandler())

app.namespace '/remote', () ->
    app.get('/', routes.index)

server = http.createServer(app).listen(app.get('port'), () ->
    console.log('Express server listening on port ' + app.get('port'))
)

# Websocket
connections = {}
connection_id = 0
connectionsByUser = {}

addConnectionToUser = (user, connection, isRemote) ->
    connection.user = user
    console.log "adding connection #{connection.id} to user #{user}"
    connection.isRemote = isRemote
    if not connectionsByUser.hasOwnProperty(user)
        connectionsByUser[user] = {devices : [], remotes: []}
    if isRemote
        connectionsByUser[user]["remotes"].push(connection.id)
    else 
        connectionsByUser[user]["devices"].push(connection.id)

originIsAllowed = (origin) ->
    console.log origin
    true

wsServer = new WebSocketServer({
    httpServer: server
})

wsServer.on('request', (request) ->
    console.log "new request"
    if not originIsAllowed(request.origin)
        request.reject

    connection = request.accept(null, request.origin)
    connection_id += 1
    connections[connection_id] = connection
    connection.id = connection_id

    connection.on('message', (message) ->
        if message.type == 'utf8'
            msgObj = JSON.parse message.utf8Data
            console.log connection.id + " :" + message.utf8Data
            
            if msgObj.type == "Authentification"
                user = msgObj.data.user
                addConnectionToUser(user, connection, false)
                resp = new AuthentificationMessage(connection.id, id : connection.id)
                connection.sendUTF(resp.stringify())
                sendDeviceListToRemotes(msgObj.data.user)

            else if msgObj.type == "AuthentificationRemote"
                # send list of controlables
                user = msgObj.data.user
                addConnectionToUser(user, connection, true)
                devices = connectionsByUser[user]["devices"]
                resp = new DevicesListMessage(connection.id, devices : devices)
                connection.sendUTF(resp.stringify())

            else if msgObj.type == "Action"
                target = connections[msgObj.to]
                target.sendUTF(message.utf8Data)

            else if msgObj.type == "Status"
                for remoteId in connectionsByUser[connection.user]["remotes"]
                    conn = connections[remoteId]
                    conn.sendUTF(message.utf8Data)


        else 
            console.log "Not UTF8 message"
    )

    connection.on('close', () ->
        user = connection.user
        id = connection.id
        # remove from connection list
        delete connections[id]
        # remove from connection by user
        type =  if connection.isRemote then "remotes" else "devices"
        console.log "closing connection #{id} of #{user} / type: #{type}"
        array = connectionsByUser[user][type]
        index = array.indexOf(id)
        array.splice(index, 1)
        sendDeviceListToRemotes(user)
    )
)

sendDeviceListToRemotes = (user) ->
    for remoteId in connectionsByUser[user]["remotes"]
        conn = connections[remoteId]
        devices = connectionsByUser[user]["devices"]
        resp = new DevicesListMessage(conn.id, devices : devices, other: connectionsByUser)
        conn.sendUTF(resp.stringify())

class Message
    constructor: (@type, @from, @to, @data) ->
    stringify: () -> JSON.stringify(@)

class AuthentificationMessage extends Message
    constructor: (to, data) ->
        super("Authentification", "server", to, data)

class DevicesListMessage extends Message
    constructor: (to, data) ->
        super("DevicesList", "server", to, data)