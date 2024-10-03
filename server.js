//For acessing .env file variables
const express = require('express');
const http = require('http');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')


const socketIO = require('socket.io');

//JWT Module
const jwt = require('jsonwebtoken')
require('dotenv').config();
 
//MongoDB server Connect
//{ connectDB, listallColl, userModel, EmployeesModel } 
const Mongodb = require('./DBconn')
const mongoose = require('mongoose');
// const Auth = require('./Authentication');
const { userInfo } = require('os');







const app = express();
const server = http.createServer(app);

//pasring json,cookies for sending and reciving work with those
app.use(express.json());
app.use(bodyParser.json())
app.use(cookieParser())


const allowedOrigin = process.env.FRONTEND_URL;
console.log('Allowed Origin:', allowedOrigin); // Log the allowed origin for debugging

const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};
 
// Apply CORS middleware
app.use(cors(corsOptions));


// Creating socket Instance
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL, // Remove the trailing slash
    methods: ["GET", "POST"],
    credentials: true
  }
});



//creating map to store username and 
let activeUsers = new Map();

//creating map to store users in chat with connected user(contact)
let usersInChat = new Map();

//we have to write all emit $ on evets inside this method
io.on('connection', (socket) => {
  let pname;
  let usersSet = new Set() //induvidual set for every user to hold active users
  let UserFriends = []; // to store individual users to check in active users
  let mapArray = [];// to store all socket connected users names
  let FrdsInChat = new Set();// to store all usersInChat connected users name
  let vals = [];// to store all usersInChat connected users name
 // let Afrds; //holds the set values as array
  
  console.log(`User connected with Id : ${socket.id}`);

  //Adding the connected user into map to add activeUsers feature
  socket.on('addactiveuser',({uname,friends}) =>{

    pname = uname; 
    //adding friends values in the socket array var
    UserFriends = friends;

    //console.log(`Adding User in To map : ${uname}`)
    //console.log(`friends from  : ${friends}`)
    //adding key-value pair into the map.
    activeUsers.set(socket.id, uname);

    //const frdsList = friends;
    //console.log(`Map adding method : ${friends}`)
//filtering the active users by compoaring a user friendslist & all socket connected user(map)
    friends.forEach(name => {
      for(let mapname of activeUsers.values()){
        if(mapname === name && mapname != uname){
          usersSet.add(name);
        }
      }
    });
    let Afrds = Array.from(usersSet);
    

    //console.log(`From Map adding Method : ${Afrds}`)

    //To know all connected users from the map
    for(let user of activeUsers.values()){
        mapArray.push(user)
    }
    //console.log(`All conneted users: ${mapArray}`)
    sendActiveUsers(socket,Afrds)

//for sending data of a user is online to all online frds of that user 
    io.emit('online',uname);
    //Printing the Afrds all active users of a user
    console.log(`Active frds of ${uname} from Set: ${Afrds}`);
  })

  //sending active users data to the frontend by socket
/*   socket.on('msgNotify',(uname) => {
    const reciver = 'Dattu';
    const msg = 'hello'
    console.log(`${uname} connected in msg Notify`)
    sendNotification(socket,reciver,msg);
  }) */



  //joining a user with in a room for 1-1
  socket.on('join',(uname) => {
    socket.join(uname); //very importent code to pass msgs
    console.log(`${uname} joined in a room`)
  })
  
  //to send msg for all connected users
/*   socket.on('allusers',(msg) => {
    socket.broadcast.emit('server-msg', msg) ; 
    console.log(msg)
    // socket.emit('server-msg', msg);
  }) */


  //Handling event 'userinchatroom' when a user with a contcact's room
  socket.on('userInChatroom', (reciver) => {
    console.log(`Sender : ${pname}, reciver : ${reciver}`);
    //adding userName & reciver(contact) into usersInChat
    usersInChat.set(pname,reciver);

    console.log(`ALL Users Inside Chat After Adding: `)
    for(let user of usersInChat.keys()){
      UserFriends.forEach(name => {
         if(name === user){
            FrdsInChat.add(user)
           // console.log(user)
         }
      })
      //console.log(`${user}`)
    }

    for(let user of usersInChat.keys()){
        console.log(user)
    }

    //console.log(`All Keys : ${keys}\n All Vals : ${vals}`)
  })

  //Handling event to delete user from map "UsersInChat"
  socket.on('dltuserinchat',(name) => {
    usersInChat.delete(name);
   // console.log(`ALL Users Inside Chat After Deleting: `)
    for(let user of usersInChat.keys()){
      console.log(`${user}`)
    }

    //deleting from FrdsInChat set
    FrdsInChat.delete(name);
/*     console.log(`Frds Inside Chat After Deleting: `)
    frdsList.forEach(name => {
      console.log(name)
    }) */

  })

  //Handling the typing msg feature 
  socket.on('typing', async({reciver}) => {
        // console.log(`typing event executing: ${reciver} , sender : ${pname}`)
        let status = false;
        for(let mapname of activeUsers.values()){
          if(mapname === reciver && mapname != pname){
              status = true;
          }
        }
      // console.log(`Reciver In Chat  : ${inchat}`)
      if(status){ //if reciver is online 
        console.log(`Reciver ${reciver} is online`)
        // const receiverSocket = getSocketByUsername(reciver); // Implement this function to get the receiver's socket
        socket.to(reciver).emit('sender-typing', { name: pname });
      }
      else{
        //Store msgs in DB if users is offline
        console.log(`Reciver ${reciver} is offline`)
      }
  })

  
  //Handling 1-1 personal msgs
  socket.on('p-msg',async ({ msg, reciver }) => {
    console.log(`Received private msg from socketId: ${socket.id}  ${msg} to ${reciver}`);
    //const status = usersSet.has(reciver);
    //serching if the reciver is online or not 
    let status = false;
      for(let mapname of activeUsers.values()){
        if(mapname === reciver){
            status = true;
        }
      }
    //calling evet if user is active
    console.log(`status : ${status}`)
    
    let inchat = false;
    //iterating to check the reciver is in chat or not
    for(let user of usersInChat.keys()){
      if(user === reciver){
         inchat = true;
      }
    } //need performace improve by using userFrds instead of all users In Chat Map
    

    console.log(`Reciver In Chat  : ${inchat}`)
    if(status){ //if reciver is online 
       //Call the typing event in the frontend by using sender name
      if(inchat){ //If reciver is in a chat open 
        const timestamp = new Date().toISOString() 

       socket.to(reciver).emit('server-msg',  msg, timestamp);
      //  Mongodb.sendMsgs(reciver, pname, msg)
      }
      else{ //if reciver is not in a chat but online
        //sendNotification(socket,reciver,msg);
        await Mongodb.sendMsgs(reciver, pname, msg)
        await Mongodb.reciveMsgs(reciver, pname, msg)
        socket.to(reciver).emit('msg-notify',{ msg: msg, sender : pname });
        // socket.to(reciver).emit('msg-notify',{ msg: msg, sender : pname });
      }
    }
    else{
      //Store msgs in DB if users is offline
      Mongodb.offlinereciveMsgs(reciver,pname,msg)
      Mongodb.offlinesendMsgs(reciver,pname,msg)
    }
  });




  //Handling conneteing group chat event "groom"
  socket.on('join-room', (groom,user) => {
      socket.join(groom);
      console.log(`${user} joined the Group Chat`);
  })

  //Handling msgs sent from users in a gchat
  socket.on('g-msg', (msg,room) => {
    console.log(`Received group msg from socketId: ${socket.id}  ${msg}`);
    socket.to(room).emit('room',  msg);
  });
  

  //handling disconnect
  socket.on('disconnect', () => {
    const Activefrds = [];
    const offlineFrd = activeUsers.get(socket.id);
    // Perform cleanup or other operations using the username
    activeUsers.delete(socket.id); // Remove the user from the connectedUsers map
    console.log(`user disconnected : ${socket.id}`)
    //console.log( `UserFriends Individual Array : ${UserFriends}`);
    //const frdsList = friends;
    UserFriends.forEach(name => {
      for(let mapname of activeUsers.values()){
        if(mapname === name){
          Activefrds.push(name);
        }
      }
    });

    //deleting the user from set after disconnecting
    usersSet.delete(offlineFrd)

    //deleting a user who directly leave from chat
    //FrdsInChat.delete(name);

    console.log(`Active Friends From Aarry Delete: ${Activefrds}`)
    sendOfflinedUsers(offlineFrd)
    //sendActiveUsers(socket, Activefrds)
    console.log(`Offling frd : ${offlineFrd}`);

  })


      
});



//Creating a middleware function to check the token and user details whether the token is vailed or not 
//this method we allocate to every other route after a user logged in for cheking thire token validity
const authenticateToken = (req, res, next)  => {
  // console.log(`Middle ware called`)
   token = req.cookies.JWTcookie;
   //console.log(`Tokem from Auth : ${token}`);
    try{
  // const token = req.cookie.token;
  // console.log('Cookiee = ', token)
   if(token==null) {
       console.log(`No token avialable`)
       return res.sendStatus(401)
      // return res.json({"status": "User Not Loged In"})
   }
   //comparing jwt token which comes from client request and real token secretKey && userdata by using "jwt.verify()" method 
   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
       if(err){
           //console.log(`From Middleware Token not valied`)
           return res.sendStatus(401)
       }
       //username extracted from the "JWT" token payload sent from the user for db operations
       req.username = decode.name //here payload is "user_Id"
       // console.log(`From middleware : ${req.username}`)
       next() //This will allow use to the next step in the "/users" and all other which needs needsto check JWT in route GET method.
   }) 
 }
 catch(err){
    console.log(`ERROR IN Middleware : ${err}`)
    res.status(401);
 }
}




//emiting socket event outside the io.on() method for sending active users data to frontend
const sendActiveUsers = async (socket, Activefriends) =>{
  //console.log(`From socket Method Active Friends: ${Activefriends}`)
 // console.log(`on user disconnect method : ${Afrds}`)
  socket.emit('activefriends',{Activefriends});
}


//emiting method for users to update frds are gone offline
const sendOfflinedUsers = async (disconnectedFrd) => {
  io.emit('disconnectedFrd', disconnectedFrd);//here io is used to emit bcz we need to send all the connected sockets to tell this user has disconnected
}

//emiting method to send msg/notification to specific user
const sendNotification = async (socket,reciver,msg) => {
  socket.to(reciver).emit('msgNotify',msg);
  console.log(`Notification sent`)
}


/* const  sendMsgs = (reciver, socket) =>{
  const pname = 'Arun';
  const msg = 'Hii';
  socket.to(reciver).emit('msg-notify',(pname,msg));
  console.log('msg method called')
}
 */

//Password bycrypt , Hasing Password
const bc = async(password) => {
    
  const salt = await bcrypt.genSalt()
  const hashedPassword = await bcrypt.hash(password, salt)
  //console.log(`Password : ${hashedPassword}`)
  return hashedPassword;

}


// const getHash = async() => {
//   console.log(`====================================================================`)
//   console.log(await bc('dattu123'))
// }

// getHash()

//Server routes define form here
app.post('/', async (req, res) => {
    try{
      const {mail, password} = req.body;
      const result = await  Mongodb.Credentials(mail)
      
      //retriving name from DB results
      let name;
      // Check if result is not null and has the 'name' property
        if (result && result.length > 0 && result[0].name) {
          // console.log(`${result[0]}`)
           const pwd = result[0].password
            if(await bcrypt.compare(password, pwd)){
              name = result[0].name;
              const accessToken = jwt.sign({name}, process.env.ACCESS_TOKEN_SECRET) //using uid as payload for serilization and to find a specific user for db operations & authorization in sub sequent requests
              // Set the cookie
              res.cookie('JWTcookie', accessToken, {
                  httpOnly: true,
                  secure: true, // Ensure this is true if using HTTPS
                  sameSite: 'None', // Adjust according to your needs
              });
              // console.log(`Login : ${accessToken},  name : ${username}`)
              res.json({"token" :accessToken, "access": true,"username":name})
            }
            else{
              res.json({"access": false,"reason":"pwd"})
            }
        } else {
          res.json({"acess": false,"reason":"mail"})
        }
    }
    catch(err){
      console.log(`ERR From / Route : ${err}`);
      res.json({"acess": false,"reason":"mail"})
    }
});


app.get('/', (req, res) => {
  res.send(`server working`);
});

//for signup (newly creating account by giving name & password)
app.post('/signup',async(req, res) => {
  const {username, password, mail} = req.body
  console.log(`user Details JWT: ${mail}`)
  try {
      const checkUserName = await Mongodb.checkUserName(username);
      const checkUserMail = await Mongodb.checkMail(mail);
      const name = username;
      if( checkUserName){
        if(checkUserMail){
          console.log('Executed')
          //hashing the user given pwd by using salting and hasing in method(hashPwd()) which is declred in other module(page)
          const hfoperation = await bc(password); 
          const dboperation = await Mongodb.addNewUser(username, mail, hfoperation);
      
          if(dboperation){
            //Creating JWT token by adding user name into it  and sending as a cookie to the client
            const accessToken = jwt.sign({name}, process.env.ACCESS_TOKEN_SECRET) //using uid as payload for serilization and to find a specific user for db operations & authorization in sub sequent requests
             // Set the cookie
              res.cookie('JWTcookie', accessToken, {
                  httpOnly: true,
                  secure: true, // Ensure this is true if using HTTPS
                  sameSite: 'None', // Adjust according to your needs
              });
            res.json({"token" :accessToken, "access": true,"username":username})
          }
        }
        else{
            //console.log(`Mail already exists`)
            res.json({"access": false,"reason":"mail"})
        }
      }
      else{
        res.json({"access": false,"reason":"name"})
      }
     
  } catch (err) {
      res.json({"access": false,"reason":"mail"})
      console.log(`ERROR IS From SignUp: ${err}`);
      //res.sendStatus(401);
  }

})

app.post('/islogin', authenticateToken, (req, res) => {
  try{
    //console.log(`islogin route called`)
    //res.json(`{"status" : "User with Id ${req.user} is logged in and Items can added to Cart"}`)
    res.json({'status' : true})
    //console.log(`user loggedIn`)
  }
  catch(err){
    console.log(err)
  }

})


app.get('/home', authenticateToken, async (req, res) => {
  //console.log(`Username from /home route: ${req.username}`);
  try{
    let uactive = [];
    //retiving user names from DB
    const frdsList = await Mongodb.retrieveFriends(req.username)
    //console.log(`Username from /home route: ${uactive}`);
    frdsList.forEach(name => {
      for(let mapname of activeUsers.values()){
        if(mapname === name){
          uactive.push(name);
        }
      }
    });
    
    const combinedJson = {
      userName : { name: req.username },
      friendsList : {names : frdsList},
      //active : uactive,
    }
    res.json(combinedJson); // Send JSON data with the username
  }
  catch(err){
     console.log(`ERROR from /home Route : ${err}`)
  }
});


app.get('/username', authenticateToken, async (req, res) => {
      res.json({username : req.username})
      //console.log(`username route called`)
})


//Adding a friend to a user by accepting friend request
app.post('/addfriend',authenticateToken, async(req, res) => {
    // const username = r;
    const result = await Mongodb.addFriend(req.username, req.body.name)
    const addsentrequest = await Mongodb.removeSentRequest(req.body.name, req.username)
    const addrecivedrequest = await Mongodb.removeReceivedRequest(req.username, req.body.name)
    if(addsentrequest==true && addrecivedrequest==true){
      res.json({msg : true})
    }
});

//Removing a friend of a user
app.delete('/removefriend',authenticateToken, async(req, res) => {
  console.log(`=====================================================================`)
    const result = await Mongodb.removeFriend(req.username, req.body.name)
    if(!result){
      res.json({msg : true})
    }
});


//get all friend requests of a user 
app.get('/getfriendrequest',authenticateToken, async(req, res) => {
  // console.log('Friend request Route :')
   const result = await Mongodb.getAllFriendrequests(req.username);
   res.json({requests: result});
})


// app.get('/insertuser',async (req, res) => {
//     res.send('Inserting user data ')
//     //defining/Inserting users details into the schema
//     const newUser = new Mongodb.userModel({
//       name : 'Amar',
//       email : 'amar@gmail.com',
//       password : 'amar123',
//       friends : []
//     })
//     //saving the newUser doc in the database
//     await newUser.save()
//     .then( user => {
//       console.log(`User doc added into the db`)
//     })
//     .catch(err => {
//       console.log(err)
//     })
// })

app.get('/getallmsgs', authenticateToken, async(req, res) => {
  
 // console.log(`Route Name : ${req.username}`)
   const result = await Mongodb.getAllMsgs(req.username)
  //  console.log(`OfflineMsgs : ${result.offlineReceivedMsgs}`);
   res.json(result)
})

//Retriving collections 
app.get('/collections',async  (req, res) => {
    res.json(Mongodb.listallColl())
})

//retriving all documents from a collections
app.get('/users', async (req, res) => {
  try {
      const users = await Mongodb.userModel.find({age : 30},{name:true});
      //console.log(users);
      res.json(users);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error retrieving users from the database');
  }
});


//Updating data in the collection 
app.get('/updateuser', async (req, res) => {
  try{
    const result = await Mongodb.userModel.updateOne({name:'Dattu'},{$set : {age : 40}}, {});
    //console.log(`User Updated : ${result}`)
  }
  catch(err){
    console.log(`ERR from Updating User : ${err}`)
  }
})


//Deleting data from collection
//to delete multiple docs at a time
/* const query = { name: { $in: ['Dattu', 'Arun Kumar',] } };
const result = await userModel.deleteMany(query);
 */

app.get('/deleteuser',authenticateToken, async(req, res) => {
  try{
    const result = await Mongodb.userModel.deleteMany({});
    res.send(result)
  }
  catch(err){
    console.log(err)
  }
}) 


//To add new field to all documents of a collection 
app.get('/addfield', async (req, res) => {
  try {
    const result = await Mongodb.userModel.updateMany(
      {}, // Match all documents
      { $set: { "offlineMsgs": [] } } // Set the newField to an empty array
    );
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post('/deletemsgs',authenticateToken,async (req, res) => {
  try{
    const { friendName} = req.body;
    const name =  req.username;
    //In present user pov friend how sent messages is 'Sender' and who using is 'reciver'
    const opration = await Mongodb.deleteRecivedSendMsgs(name, friendName)
    res.json({ success: true });
  }
  catch(err){
    console.log(`Error From /deletemsgs route : ${err}`)
  }
})

//FindUsers while users search for a friend by giving name
app.post('/finduser',authenticateToken, async(req, res) => {
  try{
    const userList = await Mongodb.findUser(req.body.name, req.username );
    res.json(userList); // Send response to the client
    
  } catch (err) {
    console.error(`Error in FindUser route: ${err.message}`);
    res.status(500).json({ message: 'Internal server error' }); // Return an error response
  }
})

//Retriving the number of friends a user have to show profile to searched users
app.post('/getuserdetails',authenticateToken, async(req, res) => {
  try{
    const userfriends = await Mongodb.getUserDetails(req.body.name, req.username)
    res.json({data : userfriends})
  }
  catch(err){
    console.log(`Error from '/getuserfetails' : ${err}`)
  }
})

//Adding the user name into the sent and recived friend request of both users who sent and recived.
app.post('/sendfriendrequest',authenticateToken,async(req, res) => {
  try{
    //Accessing the current user name from AUTH function 'req.username' not sent from frontend
    const addsentrequest = await Mongodb.addSentRequest(req.username,req.body.name)
    const addrecivedrequest = await Mongodb.addReceivedRequest(req.body.name,req.username)
    if(addsentrequest==true && addrecivedrequest==true){
      res.json({msg : true})
    }
    else{
      res.json({msg : true})
    }
  }
  catch(err){
    console.log(`Error from '/getuserfetails' : ${err}`)
    res.json({msg : err})
  }
})

//Removing or Ignoring A user friend request from Friend requests DB
app.post('/ignorefriend',authenticateToken,async(req, res) => {
  try{
    //Accessing the current user name from AUTH function 'req.username' not sent from frontend
    const addsentrequest = await Mongodb.removeSentRequest(req.body.name,req.username)
    const addrecivedrequest = await Mongodb.removeReceivedRequest(req.username,req.body.name)
    if(addsentrequest==true && addrecivedrequest==true){
      res.json({msg : true})
    }
    else{
      res.json({msg : true})
    }
  }
  catch(err){
    console.log(`Error from '/getuserfetails' : ${err}`)
    res.json({msg : err})
  }
})


app.post('/removefriendrequest',authenticateToken,async(req, res) => {
  try{
    //Accessing the current user name from AUTH function 'req.username' not sent from frontend
    const addsentrequest = await Mongodb.removeSentRequest(req.username,req.body.name)
    const addrecivedrequest = await Mongodb.removeReceivedRequest(req.body.name,req.username)
    if(addsentrequest==true && addrecivedrequest==true){
      res.json({msg : true})
    }
    else{
      res.json({msg : true})
    }
  }
  catch(err){
    console.log(`Error from '/getuserfetails' : ${err}`)
    res.json({msg : err})
  }
})

//Upload Images
// Multer setup for file storage in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload image route
app.post('/uploadImage', upload.single('image'), async (req, res) => {
  try {
    const { username } = req.body;
    const result = await Mongodb.uploadImage(username)

  } catch (err) {
    res.status(500).json({ message: 'Error uploading image', error: err.message });
  }
});



//to display active users in Array
app.get('/activeusers', (req, res) => {
  
/*     uactive.forEach((name) => {
      console.log(name)
    })
   res.send(uactive) */
})

/* const sendMsg = () => {
  Mongodb.Mongodb.sendMsgs('Arun', 'Dattu');
}

sendMsg(); */


const PORT = 4040;
server.listen(PORT, () => {
  console.log(`Server started on PORT : ${PORT}`);
});


Mongodb.connectDB();
