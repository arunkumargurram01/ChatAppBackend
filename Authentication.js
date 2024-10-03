//JWT Module
const jwt = require('jsonwebtoken')
require('dotenv').config();


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

module.exports = authenticateToken;