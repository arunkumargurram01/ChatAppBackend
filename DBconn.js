require('dotenv').config();
const mongoose = require('mongoose');

/*
//This is an outdated  way of accessing the DB by using useUnifiedTopology && useNewUrlParser
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_URI, {
            useUnifiedTopology: true,
            useNewUrlParser: true
        });
        console.log(`MongoDB Connected`);
    } catch (err) {
        console.error(`MongoDB connection error: ${err}`);
    }
}; */

//Connecting to the DB using async functions
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MongoDB_URI);
        console.log(`MongoDB Connected`);
       /*  await listallColl(); */
    } catch (err) {
        console.error(`MongoDB connection error: ${err}`);
    }
};





//listing all the Schemas in the DB test
const listallColl = async () => {
    try {
       // console.log("Listing all collections...");
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:");
        collections.forEach(collection => {
            console.log(collection.name);
        });
        return collections;
        //console.log("Finished listing collections.");
    } catch (err) {
        console.error("Error listing collections:", err);
    }
};

//CREATING SCHEMAS FOR COLLECTIONS

//Mogodb Schema FOR Employees
 const employeesSchema = new mongoose.Schema({
    name : {type : String, required:true},
    email : {type:String, required : true, unique:true},
    age:{type : Number}
  })
  
//Defining the model based on schema
//By using model we can do operations on the data inside of a collection
  const EmployeesModel = mongoose.model('Employees',employeesSchema);

//Exporting Employees model
/* module.exports = {EmployeesModel} */


//users schema 
/* const userSchema = new mongoose.Schema({
    name : {type:String, reqiuired: true, unique : true},
    email : {type:String, required:true, unique : true},
    password : {type:String, require: true,},
    friends : [{type : mongoose.Schema.Types.ObjectId, ref : 'users'}],

}) */
/* const userSchema = new mongoose.Schema({
    name: {type:String, reqiuired: true, unique : true},
    email: {type:String, required:true, unique : true},
    password: {type:String, required:true,},
    friends: [{type : mongoose.Schema.Types.ObjectId, ref : 'users'}],
    messages: {
      recivedmsgs: {
        Arun: [String],
        Amar: [String],
        Harish: [String],
      },
      sendmsgs: {
        Arun: [String],
        Amar: [String],
        Harish: [String],
      }
    }
  }, { versionKey: false }); */
const userSchema = new mongoose.Schema({
    name: {type:String, reqiuired: true, unique : true},
    email: {type:String, required:true, unique : true},
    password: {type:String, required:true,},
    friends: [{type : mongoose.Schema.Types.ObjectId, ref : 'users'}],
    messages: {
        offlinemsgs: {
            sendmsgs: {
              type: Map,
              of: [{
                message: String,
                timestamp: String
                }]
            },
            recivedmsgs: {
              type: Map,
              of: [{
                    message: String,
                    timestamp: String
                }]
            }
          },
          onlinemsgs: {
            sendmsgs: {
              type: Map,
              of: [{
                    message: String,
                    timestamp: String
                }]
            },
            recivedmsgs: {
              type: Map,
              of: [{
                    message: String,
                    timestamp: String
                }]
            }
          }
    },
    friendrequests: {
        receivedrequests: [{ type: String }], // Store usernames of users who sent friend requests
        sentrequests: [{ type: String }] // Store usernames of users to whom this user sent friend requests
    },
      
},{ versionKey: false });


//Creating model for "users" Schema
const userModel = mongoose.model('Users', userSchema)


//"messages" Schema adding in existing schema code
async function addMessagesFieldToExistingUsers() {
    try {
        // Connect to MongoDB (replace with your connection string)
        await mongoose.connect(`mongodb+srv://Arun:PfKonafiMZebfkUo@mymongosever.3s8icra.mongodb.net/?retryWrites=true&w=majority`, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Update all documents that don't have the 'messages' field
        await userModel.updateMany(
            { messages: { $exists: false } },
            {
                $set: {
                    messages: {
                        offlinemsgs: {
                            sendmsgs: new Map(),
                            recivedmsgs: new Map()
                        },
                        onlinemsgs: {
                            sendmsgs: new Map(),
                            recivedmsgs: new Map()
                        }
                    }
                }
            }
        );

        console.log('Messages field added to existing users successfully');
    } catch (error) {
        console.error('Error adding messages field:', error);
    } finally {
        // Close the connection
        await mongoose.connection.close();
    }
}
//  addMessagesFieldToExistingUsers();


//exporting userModel to use it in the other modules
/*     module.exports = {userModel} */


//check email for signup if email already exist or not
//CheckMail for new user given mail is already used or not to create a account.
const checkMail = async(umail) => {
    try{
        const result = await userModel.find({email : umail})
        if(result==""){
            console.log(`User can create account using this mail`)
            return true;
        }
        else{
            console.log(`Mail already Used`)
            return false;
        }
    }
    catch(err){
        console.log(`ERROR from checkMail : ${err}`)
        return false;
    }
}

const checkUserName = async(uname) => {
    try {
        const result = await userModel.find({ name: { $regex: new RegExp(`^${uname}$`, 'i') } });
        
        if (result.length === 0) {  // Use length to check if result is empty
            console.log(`User can create account using this name`);
            return true;
        } else {
            console.log(`Name already used`);
            return false;
        }
    } catch (err) {
        console.log(`ERROR from checkUserName: ${err}`);
        return false;
    }
};


//Adding a new user to the DB when a user SignUp.
const addNewUser = async(uname, umail, pswd) => { 
    try {
        // Creating a new user with the provided details
        const newUser = new userModel({
            name: uname,
            email: umail,
            password: pswd,
            friends: [], // Initialize friends array as empty
            messages: {
                offlinemsgs: {
                    sendmsgs: new Map(),
                    recivedmsgs: new Map()
                },
                onlinemsgs: {
                    sendmsgs: new Map(),
                    recivedmsgs: new Map()
                }
            },
            friendrequests: {
                receivedrequests: [], // Initialize received requests as empty array
                sentrequests: [] // Initialize sent requests as empty array
            }
        });

        // Save the new user to the database
        await newUser.save(); 
        console.log(`User ${uname} added successfully.`);
        return true;
    } catch (err) {
        console.log(`Error from AddUser: ${err}`);
        return false;
    }
}






//CRUD operations on Schemas
//retrive all documents from a colection
// Extracting user details after login to verify the credentials
const Credentials = async (umail) => {
    try{
       // const query = { name: { $in: ['Dattu', 'Arun Kumar',] } };
        const usecred = await userModel.find({email:umail});
        //console.log(usecred)
        if(usecred.length !== 0){
            const userdetails = await userModel.find({email:umail}, {name:1,email:1,password:1});
            return userdetails;
        }
        else{
            return false;
        }
    }
    catch(err){
        console.log(`ERR while retriving USER CREDENTIALS : ${err}`)
    }
}


const addFriend = async (uname, friendName) => {
    try {

        // Find the friend's ObjectId by their name
        const friend = await userModel.findOne({ name: friendName }, '_id');
        const ObjId = friend._id; // Directly use the ObjectId
        console.log(`FriendUser Id : ${ObjId}`)

        // Find the user by uname and add friendId to the user's 'friends' array
        const user = await userModel.findOneAndUpdate(
            { name: uname }, // Find the user by uname
            { $addToSet: { friends: ObjId } }, // Add the ObjectId directly to the 'friends' array
            { new: true } // Return the updated document
        );

        const currentUser = await userModel.findOne({ name: uname }, '_id');
        const userObjId = currentUser._id;

        console.log(`CurrentUser Id : ${userObjId}`)

        const friendObj = await userModel.findOneAndUpdate(
            { name: friendName }, // Find the user by uname
            { $addToSet: { friends: userObjId } }, // Add the ObjectId directly to the 'friends' array
            { new: true } // Return the updated document
        );

        if (user && friendObj) {
            console.log(`Successfully added ${friendName} to ${uname}'s friends list`);
            console.log(`Successfully added ${uname} to ${friendName}'s friends list`);
            return true;
        } else {
            console.log(`User with name ${uname} not found`);
            return false;
        }

    } catch (err) {
        console.log(`ERR from addFriend: ${err}`);
    }
};


//Removing Friend from Friends List 
const removeFriend = async (uname, friendName) => {
    try {
        // Find the friend's ObjectId by their name
        const friend = await userModel.findOne({ name: friendName }, '_id');
        if (!friend) {
            console.log(`Friend with name ${friendName} not found`);
            return false;
        }
        const ObjId = friend._id; // Get the friend's ObjectId
        console.log(`FriendUser Id : ${ObjId}`);

        // Remove friend's ObjectId from the user's 'friends' array
        const user = await userModel.findOneAndUpdate(
            { name: uname }, // Find the user by uname
            { $pull: { friends: ObjId } }, // Remove the ObjectId from the 'friends' array
            { new: true } // Return the updated document
        );

        if (!user) {
            console.log(`User with name ${uname} not found`);
            return false;
        }

        const currentUser = await userModel.findOne({ name: uname }, '_id');
        const userObjId = currentUser._id;

        console.log(`CurrentUser Id : ${userObjId}`);

        // Remove user's ObjectId from the friend's 'friends' array
        const friendObj = await userModel.findOneAndUpdate(
            { name: friendName }, // Find the friend by name
            { $pull: { friends: userObjId } }, // Remove the user's ObjectId from the 'friends' array
            { new: true } // Return the updated document
        );

        if (friendObj) {
            console.log(`Successfully removed ${friendName} from ${uname}'s friends list`);
            console.log(`Successfully removed ${uname} from ${friendName}'s friends list`);
            return true;
        } else {
            console.log(`Failed to remove ${uname} from ${friendName}'s friends list`);
            return false;
        }

    } catch (err) {
        console.log(`ERR from removeFriend: ${err}`);
        return false;
    }
};




const retrieveFriends = async (uname) => {
    try {
        const user = await userModel.findOne({ name: uname });
        const userId = user._id; //accsing use objId from DB
        const friendNames = await userModel.aggregate([
            { $match: { _id: userId } }, // Match the user document by its ID directly
            { $unwind: "$friends" }, // Unwind the friends array to deconstruct it into individual documents
            {
                $lookup: {
                    from: "users", // The collection where user documents are stored
                    localField: "friends", // The field in the current collection (userModel) that holds the friend's ID
                    foreignField: "_id", // The field in the foreign collection (users) where the ID is stored
                    as: "friendDetails" // The name of the field to add the friend document
                }
            },
            { $unwind: "$friendDetails" }, // Unwind the friendDetails array to deconstruct it into individual documents
            { $project: { _id: 0, friendName: "$friendDetails.name" } } // Project only the friend names
        ]);

        //console.log(friendNames);
        return friendNames.map(friend => friend.friendName);
    } catch (err) {
        console.log(`ERR from retrievingFriends: ${err}`);
    }
}



//Adding msgs to send msgs inside sender when the reciver is not in chat but online
const sendMsgs = async( receiverName, senderName, msg) => {
    try {
        // console.log(`sendMsgs func called\n Sender : ${senderName} \n ReciverName : ${receiverName}`)
        const user = await userModel.findOne({ name: senderName });
        if (!user) {
            console.log("Sender not found");
            return;
        }
        else{
            //console.log(`senderName : ${senderName},  reciverName : ${receiverName}`)
            const user = await userModel.findOne({ name: senderName });
            const userId = user._id; //accsing senders objId from DB

            // Create the message object with both message content and timestamp
            const messageObj = {
                message: msg,
                timestamp: new Date().toISOString() // Get the current timestamp in ISO format
            };
            // Create the update object dynamically
            const updateObj = {};
            updateObj[`messages.onlinemsgs.sendmsgs.${receiverName}`] = messageObj;

            // Execute the update
            await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $push: updateObj }
            );

            console.log('Message added successfully');
        }

        // Check if the messages object is present
        if (!user.messages) {
            console.log("Messages object not found");
            return;
        }

        // Log the contents of the messages object
        //console.log("Messages:", user.messages);

        // Accessing received messages
        const receivedMsgs = user.messages.recivedmsgs.receiverName;
        //console.log("Received messages from sendMsg func DB:", receivedMsgs);

        // Accessing sent messages
        const sentMsgs = user.messages.sendmsgs;
        //console.log("Sent messages from sendMsg func DB:", sentMsgs);
    } catch (error) {
        console.error("Error:", error);
    }
}

//Adding msgs to recived msgs inside reciver when the reciver is not in chat but online
const reciveMsgs = async( receiverName, senderName, msg) => {
    try {
        // console.log(`sendMsgs func called\n Sender : ${senderName} \n ReciverName : ${receiverName}`)
        const user = await userModel.findOne({ name: receiverName });
        if (!user) {
            console.log("Sender not found");
            return;
        }
        else{

            //console.log(`receiverName : ${receiverName},  reciverName : ${receiverName}`)
            const user = await userModel.findOne({ name: receiverName });
            const userId = user._id; //accsing senders objId from DB
            console.log(`Reciver     Time stamp =  ${new Date().toISOString()}`)


            // Create the message object with both message content and timestamp
            const messageObj = {
                message: msg,
                timestamp: new Date().toISOString() // Get the current timestamp in ISO format
            };

            // Create the update object dynamically
            const updateObj = {};
            updateObj[`messages.onlinemsgs.recivedmsgs.${senderName}`] = messageObj;
            
            // Execute the update
            await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $push: updateObj }
            );

            console.log('Message added successfully');
        }

        // Check if the messages object is present
        if (!user.messages) {
            console.log("Messages object not found");
            return;
        }

        // Log the contents of the messages object
        //console.log("Messages:", user.messages);

        // Accessing received messages
        // const receivedMsgs = user.messages.recivedmsgs.receiverName;
        // console.log("Received messages from sendMsg func DB:", receivedMsgs);

        // // Accessing sent messages
        // const sentMsgs = user.messages.sendmsgs;
        //console.log("Sent messages from sendMsg func DB:", sentMsgs);
    } catch (error) {
        console.error("Error:", error);
    }
}


//Adding msgs to recived msgs inside reciver when the reciver is not in chat or offline
const offlinereciveMsgs = async( receiverName, senderName, msg) => {
    try {
        // console.log(`sendMsgs func called\n Sender : ${senderName} \n ReciverName : ${receiverName}`)
        const user = await userModel.findOne({ name: receiverName });
        if (!user) {
            console.log("Sender not found");
            return;
        }
        else{
            //console.log(`receiverName : ${receiverName},  reciverName : ${receiverName}`)
            const user = await userModel.findOne({ name: receiverName });
            const userId = user._id; //accsing senders objId from DB
            console.log(`senderId = ${userId}`)

            // Create the message object with both message content and timestamp
            const messageObj = {
                message: msg,
                timestamp: new Date().toISOString() // Get the current timestamp in ISO format
            };

            // Create the update object dynamically
            const updateObj = {};
            updateObj[`messages.offlinemsgs.recivedmsgs.${senderName}`] = messageObj;
            
            // Execute the update
            await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $push: updateObj }
            );

            console.log('Message added successfully');
        }
    } catch (error) {
        console.error("Error:", error);
    }
}


//Adding msgs to send msgs inside sender when the reciver is not in chat but offline
const offlinesendMsgs = async( receiverName, senderName, msg) => {
    try {
        // console.log(`sendMsgs func called\n Sender : ${senderName} \n ReciverName : ${receiverName}`)
        const user = await userModel.findOne({ name: senderName });
        if (!user) {
            console.log("Sender not found");
            return;
        }
        else{
            //console.log(`senderName : ${senderName},  reciverName : ${receiverName}`)
            const user = await userModel.findOne({ name: senderName });
            const userId = user._id; //accsing senders objId from DB

            // Create the message object with both message content and timestamp
            const messageObj = {
                message: msg,
                timestamp: new Date().toISOString() // Get the current timestamp in ISO format
            };

            // Create the update object dynamically
            const updateObj = {};
            updateObj[`messages.offlinemsgs.sendmsgs.${receiverName}`] = messageObj;

            // Execute the update
            await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(userId) },
            { $push: updateObj }
            );

            console.log('Message added successfully');
        }

        // Check if the messages object is present
        if (!user.messages) {
            console.log("Messages object not found");
            return;
        }

        // Log the contents of the messages object
        //console.log("Messages:", user.messages);

        // Accessing received messages

        // Accessing sent messages
        const sentMsgs = user.messages.sendmsgs;
        //console.log("Sent messages from sendMsg func DB:", sentMsgs);
    } catch (error) {
        console.error("Error:", error);
    }
}


//Add friendName() to mssages 
const addFriendToMsgs = async(uname, fname,messageType, subType) => {
    try {
    
        const user = await userModel.findOne({ name: uname });
        const userId = user._id; //accsing use objId from DB

        // Create the update object dynamically
        const updateObj = {};
        updateObj[`messages.${messageType}.${subType}.${fname}`] = [];
    
        // Execute the update
        await userModel.updateOne(
          { _id: new mongoose.Types.ObjectId(userId) },
          { $set: updateObj }
        );
    
        console.log(`Name ${fname} added successfully to ${subType} in ${messageType}`);
      } catch (error) {
        console.error('Error adding name:', error);
      } finally {
        // Close the connection
      }
}

//addFriendToMsgs('Arun','Amar','offlinemsgs','sendmsgs')


//Get all the messages from the Database
const getAllMsgs = async(username) => {
    try {

        console.log(`Msgs Name : ${username}`)
        const user = await userModel.findOne({ name: username }).select('messages.onlinemsgs.recivedmsgs messages.offlinemsgs.recivedmsgs messages.onlinemsgs.sendmsgs messages.offlinemsgs.sendmsgs');
        
        if (!user) {
            console.log('User not found');
            return;
        }

        const onlineReceivedMsgs = user.messages.onlinemsgs.recivedmsgs;
        const offlineReceivedMsgs = user.messages.offlinemsgs.recivedmsgs;
        const offlineSendMsgs = user.messages.offlinemsgs.sendmsgs;
        const onlineSendMsgs = user.messages.onlinemsgs.sendmsgs;

        // console.log('Online Received Messages:', onlineReceivedMsgs);
        // console.log('Offline Received Messages:', offlineReceivedMsgs);
        // console.log('Offline Send Messages:', offlineSendMsgs);
        //console.log('Online Send Messages:', onlineSendMsgs);

        return { onlineReceivedMsgs, onlineSendMsgs, offlineSendMsgs, offlineReceivedMsgs  };
       // return offlineReceivedMsgs;

    } catch (error) {
        console.error('Error fetching received messages:', error);
    }
}

//deleting all the recived and send msgs from the user database which are seen
const deleteRecivedSendMsgs = async (receiverName, senderName) => {
    try {
        // Find the sender by name
        const sender = await userModel.findOne({ name: senderName });
        if (!sender) {
            console.log("Sender not found");
            return;
        }

        const receiver = await userModel.findOne({ name: receiverName });
        if (!receiver) {
            console.log("Receiver not found");
            return;
        }

        // Get sender's ID for the database query
        const senderId = sender._id;
        const receiverId = receiver._id;

        // Remove the offline messages sent by the sender to the receiver
        await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(senderId) },
            { 
                $pull: {
                    [`messages.offlinemsgs.sendmsgs.${receiverName}`]: {}
                }
            }
        );
        await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(senderId) },
            { 
                $pull: {
                    [`messages.onlinemsgs.sendmsgs.${receiverName}`]: {}
                }
            }
        );
        console.log(`Sent messages from ${senderName} to ${receiverName} deleted`);

        // Remove the offline messages received by the receiver from the sender
        await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(receiverId) },
            { 
                $pull: {
                    [`messages.offlinemsgs.recivedmsgs.${senderName}`]: {}
                }
            }
        );
        await userModel.updateOne(
            { _id: new mongoose.Types.ObjectId(receiverId) },
            { 
                $pull: {
                    [`messages.onlinemsgs.recivedmsgs.${senderName}`]: {}
                }
            }
        );
        console.log(`Received messages for ${receiverName} from ${senderName} deleted`);

    } catch (error) {
        console.error("Error:", error);
    }
};

//Find users based on the text given at frontend and return the matched names
// Find users based on the text given at the frontend and return the matched names
const findUser = async (name, currentUser) => {
    try {
        console.log(`Searching for users with name: ${name}`);
        
        if (name !== '') {
            const users = await userModel.find(
                {
                    name: { $regex: name, $options: 'i' } // 'i' makes it case-insensitive
                },
                { name: 1, _id: 0 }
            ).limit(6);

            if (users.length > 0) {
                // Filter out the current user's name from the results
                const usersList = users.filter(user => user.name !== currentUser);
                return usersList;
            } else {
                console.log(`No users found`);
                return [];
            }
        } else {
            console.log('Search query is empty');
            return [];
        }
    } catch (err) {
        console.error(`Error from findUser: ${err}`);
        return [];
    }
};

// Function to get the ObjectId by using a username
const getObjectIdByUsername = async (username) => {
    const user = await userModel.findOne({ name: username });
    return user ? user._id : null;
};

//retriving user details like no.of friends and is the current user is in sent requests
const getUserDetails = async (name, currentUser) => {
    try {
        console.log(`name : ${name}, \n current User : ${currentUser}`)        
        // Find the target user by name
        const user = await userModel.findOne({ name: name });
        const objId = await getObjectIdByUsername(currentUser)
        if (!user) {
            console.log(`User with name ${name} not found.`);
            return null;
        } else {

            console.log(`ObjectId ${currentUser} : ${objId}`)
            // Retrieve the friends field and count the number of friends
            const numberOfFriends = user.friends.length;

            // Check if currentUser is in the friends list
            const isFriend = user.friends.includes(objId);

            // Check if currentUser is in the sentrequests array
            const hasSentRequest = user.friendrequests.receivedrequests.includes(currentUser);

            // Return an object with all the needed information
            return {
                numberOfFriends,
                isFriend,
                hasSentRequest
            };
        }
    } catch (err) {
        console.error(`Error from getUserDetails: ${err}`);
        return null;
    }
};


const addReceivedRequest = async(username, requesterUsername) => {
    try {
      const user = await userModel.findOne({ name: username }); // Find the user to whom the request was sent
      if (!user) {
        console.log('User not found');
        return;
      }
      
      // Add the requester username to the received requests array
      if (!user.friendrequests.receivedrequests.includes(requesterUsername)) {
        user.friendrequests.receivedrequests.push(requesterUsername);
        await user.save();
        console.log(`Added ${requesterUsername} to ${username}'s received requests`);
        return true;
      } else {
          console.log(`Request from ${requesterUsername} already exists`);
          return true
      }
    } catch (err) {
      console.error('Error adding received request:', err);
      return false;
    }
  };
  
  //Adding friend request to sender and reciver 
  const addSentRequest = async (username, recipientUsername) => {
    try {
      const user = await userModel.findOne({ name: username }); // Find the user who sent the request
      if (!user) {
        console.log('User not found');
        return;
      }
      // Add the recipient username to the sent requests array
      if (!user.friendrequests.sentrequests.includes(recipientUsername)) {
        user.friendrequests.sentrequests.push(recipientUsername);
        await user.save();
        console.log(`Added ${recipientUsername} to ${username}'s sent requests`);
        return true;
      } else {
          console.log(`Request to ${recipientUsername} already exists`);
          return true;
      }
    } catch (err) {
      console.error('Error adding sent request:', err);
      return false;
    }
  };

  const removeReceivedRequest = async (username, requesterUsername) => {
    try {
      const user = await userModel.findOne({ name: username }); // Find the user from whom the request should be removed
      if (!user) {
        console.log('User not found');
        return;
      }
      // Remove the requester username from the received requests array
      user.friendrequests.receivedrequests = user.friendrequests.receivedrequests.filter(
        req => req !== requesterUsername
      );
      await user.save();
      console.log(`Removed ${requesterUsername} from ${username}'s received requests`);
      return true;
    } catch (err) {
      console.error('Error removing received request:', err);
    }
  };
  
  
  const removeSentRequest = async (username, recipientUsername) => {
    try {
        // console.log(``)
      const user = await userModel.findOne({ name: username }); // Find the user who sent the request
      if (!user) {
        console.log('User not found');
        return;
      }
      // Remove the recipient username from the sent requests array
      user.friendrequests.sentrequests = user.friendrequests.sentrequests.filter(
        req => req !== recipientUsername
      );
      await user.save();
      return true;
      console.log(`Removed ${recipientUsername} from ${username}'s sent requests`);
    } catch (err) {
      console.error('Error removing sent request:', err);
    }
  };

  const getAllFriendrequests = async (username) => {
    try {
        // Find the user by username
        const user = await userModel.findOne({ name: username });

        if (!user) {
            console.log('User not found');
            return [];
        }

        // Retrieve the received requests array
        const receivedRequests = user.friendrequests.receivedrequests;
        // console.log(`Requests : ${typeof(receivedRequests.length)}`);
        return receivedRequests; // Return the array as is

    } catch (err) {
        console.error('Error retrieving friend requests:', err);
        return [];
    }
};

  





module.exports = { 
    connectDB, 
    listallColl , 
    userModel, 
    EmployeesModel, 
    Credentials,
    checkMail,
    checkUserName,
    addNewUser,
    addFriend,
    retrieveFriends,
    sendMsgs,
    reciveMsgs,
    offlinereciveMsgs,
    offlinesendMsgs,
    getAllMsgs,
    deleteRecivedSendMsgs,
    findUser,
    getUserDetails,
    addReceivedRequest,
    addSentRequest,
    removeReceivedRequest,
    removeSentRequest,
    getAllFriendrequests,
    removeFriend,
};

/* module.exports = connectDB;
module.exports = listallColl; */
