import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import {Strategy} from  "passport-local";
import env from "dotenv";

const app = express();
const port = 3000;
env.config();
const saltRounds = process.env.SALT_ROUNDS;

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24
    }
}));
  
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
    user:  process.env.POSTGRES_USER,
    host:  process.env.POSTGRES_HOST,
    database:  process.env.POSTGRES_DB,
    password:  process.env.POSTGRES_PASSWORD, 
    port:  process.env.POSTGRES_PORT,
});
db.connect();


// after session use passport
app.use(passport.initialize());
app.use(passport.session());

// Functions


// User GET routes
app.get("/",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("index.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("index.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/carbooking",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("cars.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("cars.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/driverbooking",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("drivers.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("drivers.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/bookings",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("bookings.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("bookings.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/history",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("history.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("history.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/bookingpage",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("booking-page.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("booking-page.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/hiring",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("hiring.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.render("hiring.ejs",{
            "isLoggedIn": false
        });
    }
});
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});

// Admin GET routes
app.get("/adminhome",(req,res)=>{
    res.render("admin-home.ejs");
});
app.get("/admindrivers",(req,res)=>{
    res.render("admin-drivers.ejs");
});
app.get("/adminbookings",(req,res)=>{
    res.render("admin-bookings.ejs");
});
app.get("/adminlogin",(req,res)=>{
    res.render("admin-login.ejs");
});
app.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/login'); 
    });
});

// user authentication routes
app.post("/signup", async (req,res) => {
    console.log("In signup :", req.body);
    const userDetails = req.body;
    try{
        const existingUser = await db.query("SELECT * FROM users WHERE phone_number=$1",[
            userDetails.phoneNumber
        ]);
        console.log("existing user:", existingUser.rows);
        if(existingUser.rows.length > 0){
            res.render("login.ejs",{
                "message": "Phone number already exists. Try logging in."
            });
        }else{
            bcrypt.hash(userDetails.password, saltRounds, async (err, hash) => {
                if (err) {
                  console.error("Error hashing password:", err);
                } else {
                  console.log("Hashed Password:", hash);
                  const result = await db.query(
                    "INSERT INTO users (name_, phone_number, user_password) VALUES ($1, $2, $3) RETURNING *",[
                        userDetails.name_,
                        userDetails.phoneNumber,
                        hash]
                    );
                  const user = result.rows[0];
                  req.login(user,(err) => {
                    if(err){
                      console.log("Error in login:", err);
                    }
                    res.redirect("/");
                  });
                }
            });
        }
    }catch(err){
        console.log("Error signing up : ",err);
        res.render("/signup");
    }
});
app.post("/login",  passport.authenticate("local",{
    successRedirect:"/",
    failureRedirect:"/login"
}));

// passport strategy for user authentication
passport.use(new Strategy(async function verify(username, password, cb){
    console.log("In strategy");
    try {
      const result = await db.query("SELECT * FROM users WHERE phone_number = $1", [
        username
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const storedHashedPassword = user.user_password;
        bcrypt.compare(password, storedHashedPassword, (err, result) => {
          if (err) {
            return cb(err);
          } else {
            if (result) {
              return cb(null, user);
            } else {
              return  cb(null, false);
            }
          }
        });
      } else {
        return cb("User not found.");
      }
    } catch (err) {
      return cb(err);
    }
}));
passport.serializeUser((user,cb) =>{
    cb(null,user);
});
  passport.deserializeUser((user,cb) =>{
    cb(null,user);
});

app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
});