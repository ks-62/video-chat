const { application } = require('express')
const express = require('express')
const app = express()
//to operate json file
const fs = require('fs');
// const server = require('http').Server(app)
const server = require('https').createServer({
    key: fs.readFileSync('ssl/privatekey.pem'),
    cert: fs.readFileSync('ssl/cert.pem'),
}, app)

const io = require('socket.io')(server)
const {v4: uuidV4} = require('uuid')
const { ExpressPeerServer } = require('peer')
const peerServer = ExpressPeerServer(server, {
    debug: true
})

//for post method
var bodyParser = require('body-parser');

//set view
app.set('view engine', 'ejs')
app.use(express.static('public'))

// to use post method
app.use(express.urlencoded({extended:true}))
app.use(bodyParser.json());

//routing
app.use('/peerjs', peerServer)
app.get('/', (req, res) => {
    res.redirect('/user-name')
})
app.get('/user-name', (req, res) => {
    res.render('user-name')
})
app.post('/new-room', (req, res) => {
    var ri = req.body.postRoomId
    if(!ri) {
        ri = uuidV4()
    }

    res.redirect(307, `/${ri}`)
    
})

app.get('/:room', (req, res) => {
    res.redirect(`/user-name?room=${req.params.room}`)
})

app.post('/:room', (req, res) => {
    var un = req.body.postUserName
    var ri = req.body.postRoomId
    if(!ri) ri = req.params.room

    if(!un && !ri) res.redirect(`/user-name?roomId=${req.params.room}`)
    
    res.render('room', {
        roomId: ri,
        userName: un 
    })
})


//join-room function is called as soon as they connect server
io.on('connection', socket => {
    
    socket.on('join-room', (roomId, userId) => {

        socket.join(roomId)

        //emit: sends event
        socket.to(roomId).emit('user-connected', userId)

        socket.on('disconnect', () => {
            socket.to(roomId).emit('user-disconnected', userId)
        })

        socket.on('message', (msg, sendUserName) => {
            io.to(roomId).emit('create-message', msg, sendUserName)
        })
    })
})

server.listen(443)
// server.listen(3000)
