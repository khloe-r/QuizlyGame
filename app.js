// Create HTTP Server
const express = require('express')
const app = express()
const http = require('http').createServer(app)

// Start socket.io
const io = require('socket.io')(http)

const events = require('events')
const timeUpEvent = new events.EventEmitter()

io.on('connection', (socket) => {
  console.log("A user connected!")
})

app.use(express.static('public'))
http.listen(3000, () => {
  console.log('listening on *:3000')
})

// Question Data