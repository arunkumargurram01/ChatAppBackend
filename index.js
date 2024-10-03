const express = require('express');
const path = require('path');

//we must use http module to run the server on HTTP only then only we can connect socket connecting
const http = require('http');  

const app = express();
const server = http.createServer(app);  // Create an HTTP server using HTTP module

const io = require('socket.io')(server);  // Attach Socket.IO to the server

// Path to send the HTML file
const indexPath = path.join(__dirname, 'Public', 'index.html');

// Socket connection when a user wants to connect with a socket from frontend
io.on("connection", (socket) => {
    //every user get a unique socket.id when the are connected to the socket.
    console.log(`New user connected: ${socket.id}`); 

   //joining a user with in a room
   socket.on('join',(uname) => {
    socket.join(uname);
    console.log(`${uname} joined in a room`)
   })

   //code to access the user sent msg and send all other connected users
   socket.on("user-msg", (umsg) => {
       // console.log(`User Msg : ${umsg}`);
       socket.broadcast.emit('server-msg', umsg) ; 
       //sending a msg of any user to all connected users.
   })

   socket.on('p-msg', ({ msg, reciver }) => {
     console.log(`Received private msg from socketId: ${socket.id}  ${msg} to ${reciver}`);
     socket.to(reciver).emit('p-msg', { sender: socket.id, msg });
   });



   //handling disconnect
   socket.on('disconnect', () => {
    console.log(`user disconnected`)
   })
    

});

// Routes
app.get('/', (req, res) => {
    res.sendFile(indexPath);
});

const PORT = 4040;
server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});





//Basic Node server code
/* 
    1] npm init / npm init -y (for package.json file)
    2] npm i express / npm install express (for express pack & package-lock.json  file)
    3] Then Create a Index.js file & import express create a server with a port and run it and create ports
*/
/* 
const express = require('express');

const app = express();

app.get('/',(req, res) => {
    res.send(`Home page`)
});

const PORT = 4040;
app.listen(PORT, () => {
    console.log(`Server running on ${PORT}`)
}) */