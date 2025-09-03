import jwt from 'jsonwebtoken';
//to be able to generate a token, we are going to need an environment variable

export const generateToken = (userId, res) => { //The res in this context refers to the response object provided by Express.js. It is used to send responses back to the client after the server has processed the request.
  //                  01
  //jwt.sign(payload,secret key,options)
  //options kynne object ekk
  const token = jwt.sign({userId}, process.env.JWT_SECRET, {
    expiresIn:"7d" //token expires in 7 days
  });
  //                  02
  //set the token in the cookie
  //res.cookie(cookie name,value,options)
  res.cookie("jwt", token, {
    maxAge: 7*24*60*60*1000, //cookie life time is also 7 days
    httpOnly: true, //prevent XSS attacks by not allowing JS to access the cookie
    sameSite: "strict", //prevent CSRF attacks
    secure: process.env.NODE_ENV !== "development", //since we r in localhost (development) this is going to be not secured(false)
  });

  return token;
}

// Here we generate a token and sending it to the user in a cookie.
// And this token is going to live 7 days. After a 7 days user has to login once again and get a new token via a cookie


/*
JWT(Json Web Token) library eke sign kyn function ek api use krnwa.
The jwt.sign() function creates a token by encoding the given payload and signing it with a secret key.
The token can later be used for user authentication.

{userId}
The payload is the data you want to encode in the JWT. In this case, we are encoding the userId.


*/