import express from "express";
import { getAllAvailableVehicles, getAllUnavailableVehicles, getAllAvailableDrivers, getAllUnavailableDrivers, getVehicleBookings, getAllAvailableDriversInOrder, getAllVehicleBookings, getAllDriverHirings, getDriverHirings, getActiveAndPrevious, addVehicle, addDriver , setVehicleAvalibilityFalse, setVehicleAvalibilityTrue, setDriverAvalibilityFalse, setDriverAvalibilityTrue, bookVehicle, hireDriver } from "./controller.js";
import passport from "passport";
import db from "./database.js";
import upload from "./util.js";
import bcrypt from "bcrypt";
import "./auth.js"; 
import env from "dotenv"; 

env.config();

const router = express.Router();

const saltRounds = parseInt(process.env.SALT_ROUNDS);

router.get("/",async (req,res)=>{
  let isLoggedIn = (req.isAuthenticated() && req.user.type === 'user')? true: false;
  try{
    let featuredVehiclesList = await getAllAvailableVehicles();
    if(featuredVehiclesList.length > 3){
      featuredVehiclesList = featuredVehiclesList.slice(0,3);
    }
    let featuredDriversList = await getAllAvailableDrivers();
    if(featuredDriversList.length > 3){
      featuredDriversList = featuredDriversList.slice(0,3);
    }
    res.render("index.ejs",{
      "featuredVehicles" : featuredVehiclesList,
      "featuredDrivers" : featuredDriversList,
      "isLoggedIn": isLoggedIn
    });
  }catch(err){
    console.log("Error in getting featured vehicles : ", err);
    res.render("index.ejs",{
      "isLoggedIn": isLoggedIn
    });
  }
});
router.get("/vehicles", async (req,res)=>{
  let isLoggedIn = (req.isAuthenticated() && req.user.type === 'user')? true: false;
  try{
    let availableVehiclesList = await getAllAvailableVehicles();
    res.render("vehicles.ejs",{
      "vehicles" : availableVehiclesList,
      "isLoggedIn": isLoggedIn
    });
  }catch(err){
    console.log("Error in getting all available vehicles at /vehicles : ", err);
    res.render("vehicles.ejs",{
      "isLoggedIn": isLoggedIn,
      "errorMessage" : "Vehicles could not be loaded now. Try again later."
    });
  };
});
router.get("/drivers",async (req,res)=>{
  let isLoggedIn = (req.isAuthenticated() && req.user.type === 'user')? true: false;
  try{
    let availableDriversList = await getAllAvailableDrivers();
    res.render("drivers.ejs",{
      "drivers" : availableDriversList,
      "isLoggedIn": isLoggedIn
    });
  }catch(err){
    console.log("Error in getting all available vehicles at /vehicles : ", err);
    res.render("drivers.ejs",{
      "isLoggedIn": isLoggedIn,
      "errorMessage" : "Drivers could not be loaded now. Try again later."
    });
  };
});
router.get("/bookings",(req,res)=>{
    if(req.isAuthenticated() && req.user.type === "user"){
        res.render("bookings.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.redirect("/");
    }
});
router.get("/history",async (req,res)=>{
  if(req.isAuthenticated()  && req.user.type === "user"){
    try{
      let bookingsList = await getVehicleBookings(req.user.phone_number);
      let hiringsList = await getDriverHirings(req.user.phone_number);
      let allBookings = await getActiveAndPrevious(bookingsList);
      let allHirings = await getActiveAndPrevious(hiringsList);
      console.log(allBookings);
      console.log(allHirings);
      res.render("history.ejs",{
        "isLoggedIn": true,
        "activeBookings" : allBookings[0],
        "previousBookings" : allBookings[1],
        "activeHirings" : allHirings[0],
        "previousHirings" : allHirings[1]
      });
    }catch(err){
      console.log("Error in loading history : ", err);
      res.render("history.ejs",{
        "errorMessage" : "Could not load your bookings and hirings, try again later."
      });
    }
  }else{
    res.redirect("/");
  }
});
router.get("/bookingpage",async (req,res)=>{
  if(req.isAuthenticated()  && req.user.type === "user"){
    try{
      let availableVehiclesList = await getAllAvailableVehicles();
      res.render("booking-page.ejs",{
        "isLoggedIn": true,
        "vehicles" : availableVehiclesList
      });
    }catch(err){
      console.log("Error getting all available vehicles at booking page :", err);
      res.redirect("/");
    }
  }else{
    res.redirect("/");
  }
});
router.get("/hiring",async (req,res)=>{
  if(req.isAuthenticated()  && req.user.type === "user"){
    const driversList = await getAllAvailableDriversInOrder();
    res.render("hiring.ejs",{
      "isLoggedIn": true,
      "drivers" : driversList
    });
  }else{
    res.redirect("/");
  }
});
router.get("/login",(req,res)=>{
    res.render("login.ejs");
});

router.post("/bookvehicle", async (req,res) => {
  console.log(req.body);
  if(req.isAuthenticated() && req.user.type === "user"){
    const bookingDetails = req.body;
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${year}-${month}-${day}`;
    try{
      await bookVehicle(bookingDetails, currentDate, req.user.phone_number);
      res.redirect("/history");
    }catch(err){
      console.log("Error in inserting booking details :", err);
      res.redirect("/")
    }
  }else{
    res.redirect("login");
  }
});
router.post("/hiredriver", async (req,res) => {
  console.log(req.body);
  if(req.isAuthenticated() && req.user.type === "user"){
    const hiringDetails = req.body;
    const date = new Date();
    let day = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let currentDate = `${year}-${month}-${day}`;
    try{
      await hireDriver(hiringDetails, currentDate, req.user.phone_number);
      res.redirect("/history");
    }catch(err){
      console.log("Error in inserting hiring details :", err);
      res.redirect("/")
    }
  }else{
    res.redirect("login");
  }
});
router.post("/signup", async (req,res) => {
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
                  user.type = "user";
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
router.post("/login/:type", (req, res, next) => {
    let type = req.params.type;
    passport.authenticate(type, (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        if(type === "user"){
            return res.render("login.ejs",{
                "message" : "Invalid username or password!"
            });
        }else{
            return res.render("admin-login.ejs",{
                "message" : "Invalid admin ID or password!"
            });
        }
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        if (req.user.type === "admin") {
            return res.redirect("/adminhome");
        } else if (req.user.type === "user") {
          return res.redirect("/");
        }
      });
    })(req, res, next);
});



router.get("/adminhome",async (req,res)=>{
  if(req.isAuthenticated() && req.user.type === "admin"){
    try{
      const availableVehiclesList = await getAllAvailableVehicles();
      const unavailableVehiclesList = await getAllUnavailableVehicles();
      res.render("admin-home.ejs",{
        "availableVehicles" : availableVehiclesList,
        "unavailableVehicles" : unavailableVehiclesList
      });
    }catch(err){
      console.log("Error getting all vehicles :", err);
      res.render("admin-home.ejs",{
        "errorMessage" : "There was an issue in loading vehicles details, please try again later"
      });
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/admindrivers",async (req,res)=>{
  if(req.isAuthenticated() && req.user.type === "admin"){
    try{
      const availableDriversList = await getAllAvailableDrivers();
      const unavailableDriversList = await getAllUnavailableDrivers();
      res.render("admin-drivers.ejs",{
        "availableDrivers" : availableDriversList,
        "unavailableDrivers" : unavailableDriversList
      });
    }catch(err){
      console.log("Error getting all drivers :", err);
      res.render("admin-drivers.ejs",{
        "errorMessage" : "There was an issue in loading drivers details, please try again later"
      });
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/adminbookings",async (req,res)=>{
  if(req.isAuthenticated() && req.user.type === "admin"){
    try{
      let bookingsList = await getAllVehicleBookings();
      let hiringsList = await getAllDriverHirings();
      let allBookings = await getActiveAndPrevious(bookingsList);
      let allHirings = await getActiveAndPrevious(hiringsList);
      res.render("admin-bookings.ejs",{
        "isLoggedIn": true,
        "activeBookings" : allBookings[0],
        "previousBookings" : allBookings[1],
        "activeHirings" : allHirings[0],
        "previousHirings" : allHirings[1]
      });
    }catch(err){
      console.log("Error in loading history : ", err);
      res.render("admin-bookings.ejs",{
        "errorMessage" : "Could not load your bookings and hirings, try again later."
      });
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/removevehicle/:id", async (req,res) => {
  if(req.isAuthenticated() && req.user.type === "admin"){
    let vehicleId = req.params.id;
    try{
      await setVehicleAvalibilityFalse(vehicleId);
    }catch(err){
      console.log("Error removing vehicle :",err);
    }finally{
      res.redirect("/adminhome");
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/addvehicle/:id", async (req,res) => {
  if(req.isAuthenticated() && req.user.type === "admin"){
    let vehicleId = req.params.id;
    try{
      await setVehicleAvalibilityTrue(vehicleId);
    }catch(err){
      console.log("Error removing vehicle :",err);
    }finally{
      res.redirect("/adminhome");
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/removedriver/:id", async (req,res) => {
  if(req.isAuthenticated() && req.user.type === "admin"){
    let driverId = req.params.id;
    try{
      await setDriverAvalibilityFalse(driverId);
    }catch(err){
      console.log("Error removing driver :",err);
    }finally{
      res.redirect("/admindrivers");
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/adddriver/:id", async (req,res) => {
  if(req.isAuthenticated() && req.user.type === "admin"){
    let driverId = req.params.id;
    try{
      await setDriverAvalibilityTrue(driverId);
    }catch(err){
      console.log("Error removing driver :",err);
    }finally{
      res.redirect("/admindrivers");
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.get("/adminlogin",(req,res)=>{
    res.render("admin-login.ejs");
});
router.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/login'); 
    });
});


router.post("/addvehicle", upload.single("vehicleImage"), async (req, res) => {
  console.log("In add vehicle");
  if(req.isAuthenticated() && req.user.type === "admin"){
    const vehicleDetails = req.body;
    const fullVehicleImagePath = req.file.path;
    try{
      await addVehicle(vehicleDetails,fullVehicleImagePath);
    }catch(err){
      console.log("error adding vehicle:",err);
    }finally{
      res.redirect("/adminhome");
    }
  }else{
    res.redirect("/adminlogin");
  }
});
router.post("/adddriver", upload.single("driverImage"), async (req, res) => {
  console.log("In add driver");
  if(req.isAuthenticated() && req.user.type === "admin"){
    const driverDetails = req.body;
    const fullDriverImagePath = req.file.path;
    try{
      await addDriver(driverDetails,fullDriverImagePath);
    }catch(err){
      console.log("error adding driver:",err);
    }finally{
      res.redirect("/admindrivers");
    }
  }else{
    res.redirect("/adminlogin");
  }
});

export default router;