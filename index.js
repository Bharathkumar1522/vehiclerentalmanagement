import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import session from "express-session";
import passport from "passport";
import {Strategy} from  "passport-local";
import env from "dotenv";
import multer from "multer";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const app = express();
const port = 3000;
env.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/uploads/'); // Destination folder for uploads
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // File naming
  }
});
const upload = multer({storage: storage});

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
async function getAllAvailableVehicles(){
  const result = await db.query("SELECT * FROM vehicles WHERE availability='T';");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getAllUnavailableVehicles(){
  const result = await db.query("SELECT * FROM vehicles WHERE availability='F';");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getAllAvailableDrivers(){
  const result = await db.query("SELECT * FROM drivers WHERE availability='T' ORDER BY experience DESC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getAllAvailableDriversInOrder(){
  const result = await db.query("SELECT * FROM drivers WHERE availability='T' ORDER BY driver_id ASC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getAllUnavailableDrivers(){
  const result = await db.query("SELECT * FROM drivers WHERE availability='F';");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getVehicleBookings(username){
  const result = await db.query("SELECT B.booking_id, B.user_phone_number,TO_CHAR(B.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(B.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(B.booked_date, 'DD-MM-YYYY') AS booked_date, B.price AS total_price, V.vehicle_id, V.vehicle_model, V.launched_year, V.seating_capacity, V.milage, V.price_per_day, V.transmission_type, V.vehicle_type, V.vehicle_image_path FROM bookings B JOIN vehicles V ON  B.vehicle_id = V.vehicle_id WHERE B.user_phone_number = $1 ORDER BY booked_date DESC;",[
    username
  ]);
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getAllVehicleBookings(){
  const result = await db.query("SELECT B.booking_id, B.user_phone_number,TO_CHAR(B.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(B.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(B.booked_date, 'DD-MM-YYYY') AS booked_date, B.price AS total_price, V.vehicle_id, V.vehicle_model, V.launched_year, V.seating_capacity, V.milage, V.price_per_day, V.transmission_type, V.vehicle_type, V.vehicle_image_path FROM bookings B JOIN vehicles V ON  B.vehicle_id = V.vehicle_id ORDER BY booked_date DESC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getDriverHirings(username){
  const result = await db.query("SELECT H.hiring_id, H.user_phone_number,TO_CHAR(H.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(H.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(H.hired_date, 'DD-MM-YYYY') AS hired_date, H.price AS total_price, D.driver_id, D.driver_name, D.gender, D.age, D.price_per_day, D.driver_image_path, D.drivable_vehicles, D.experience FROM Hirings H JOIN Drivers D ON  H.driver_id = D.driver_id WHERE H.user_phone_number = $1 ORDER BY hired_date DESC;",[
    username
  ]);
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getAllDriverHirings(){
  const result = await db.query("SELECT H.hiring_id, H.user_phone_number,TO_CHAR(H.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(H.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(H.hired_date, 'DD-MM-YYYY') AS hired_date, H.price AS total_price, D.driver_id, D.driver_name, D.gender, D.age, D.price_per_day, D.driver_image_path, D.drivable_vehicles, D.experience FROM Hirings H JOIN Drivers D ON  H.driver_id = D.driver_id ORDER BY hired_date DESC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
async function getActiveAndPrevious(bookings){
  console.log("in get active and previous");
  console.log(bookings);
  let activeBookings = [];
  let previousBookings = [];
  let result = [];
  let present = new Date();
  let currentDay = present.getDate();
  let currentMonth = present.getMonth() + 1;
  let currentYear = present.getFullYear();
  console.log(present);
  const length = bookings.length;
  for(let i = 0; i < length; i++){
    let toDate = (bookings[i].to_date).split("-");
    for(let i = 0; i < 3; i++){
      toDate[i] = parseInt(toDate[i]);
    }
    console.log("to_date ",toDate);
    if(toDate[2] > currentYear || (toDate[2] === currentYear && toDate[1] >= currentMonth) || (toDate[2] === currentYear && toDate[1] === currentMonth && toDate[0] >= currentDay)){
      activeBookings.push(bookings[i]);
    }else{
      previousBookings.push(bookings[i]);
    }
  }
  if(activeBookings.length === 0){
    result.push(-1);
  }else{
    result.push(activeBookings);
  }
  if(previousBookings.length === 0){
   result.push(-1);
  }else{
    result.push(previousBookings);
  }
  return result;
}

async function addVehicle(vehicleDetails,fullVehicleImagePath){
  const imageBuffer = fs.readFileSync(fullVehicleImagePath);
  try {
    const croppedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 1200, height: 800, fit: 'cover' })
      .toBuffer();
    fs.writeFileSync(fullVehicleImagePath, croppedImageBuffer);
  } catch (err) {
    console.log('Error cropping image:', err);
  }
  let dbImagePath = fullVehicleImagePath.slice(7);
  await db.query("INSERT INTO vehicles(vehicle_model, launched_year, seating_capacity, milage, price_per_day, transmission_type, vehicle_type, vehicle_image_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8);",[
    vehicleDetails.vehicleName,
    parseInt(vehicleDetails.launchYear),
    parseInt(vehicleDetails.seatingCapacity),
    parseFloat(vehicleDetails.milage),
    parseInt(vehicleDetails.pricePerDay),
    vehicleDetails.transmissionType,
    vehicleDetails.vehicleType,
    dbImagePath
  ]);
  return;
}
async function addDriver(driverDetails, fullDriverImagePath){
  const imageBuffer = fs.readFileSync(fullDriverImagePath);
  try {
    const croppedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 1200, height: 800, fit: 'cover' })
      .toBuffer();
    fs.writeFileSync(fullDriverImagePath, croppedImageBuffer);
  } catch (err) {
    console.log('Error cropping image:', err);
  }
  console.log(driverDetails);
  let dbImagePath = fullDriverImagePath.slice(7);
  await db.query("INSERT INTO drivers(driver_name, age, gender, experience, price_per_day, driver_image_path, drivable_vehicles) VALUES ($1, $2, $3, $4, $5, $6, $7);",[
    driverDetails.driverName,
    parseInt(driverDetails.age),
    driverDetails.gender,
    parseInt(driverDetails.experience),
    parseInt(driverDetails.pricePerDay),
    dbImagePath,
    driverDetails.drivableVehicles
  ]);
  return;  
}
async function setVehicleAvalibilityFalse(vehicleId){
  await db.query("UPDATE vehicles SET availability='F' WHERE vehicle_id=$1",[
    vehicleId
  ]);
  return;
}
async function setVehicleAvalibilityTrue(vehicleId){
  await db.query("UPDATE vehicles SET availability='T' WHERE vehicle_id=$1",[
    vehicleId
  ]);
  return;
}
async function setDriverAvalibilityFalse(driverId){
  await db.query("UPDATE drivers SET availability='F' WHERE driver_id=$1",[
    driverId
  ]);
  return;
}
async function setDriverAvalibilityTrue(driverId){
  await db.query("UPDATE drivers SET availability='T' WHERE driver_id=$1",[
    driverId
  ]);
  return;
}
async function bookVehicle(bookingDetails, bookingDate, userPhoneNumber){
  bookingDetails.selected_vehicle = bookingDetails.selected_vehicle.split("$");
  const vehicleId = bookingDetails.selected_vehicle[0];
  const vehiclePricePerDay = parseInt(bookingDetails.selected_vehicle[1]);
  const start_date = new Date(bookingDetails.date_from);
  const end_date = new Date(bookingDetails.date_to);
  const difference_in_milliseconds = end_date.getTime() - start_date.getTime();
  const difference_in_days = Math.round(difference_in_milliseconds / (1000 * 60 * 60 * 24)) + 1;
  const total_price = difference_in_days * vehiclePricePerDay;
  await db.query("INSERT INTO bookings(vehicle_id, user_phone_number, from_date, to_date, booked_date, price) VALUES ($1, $2, $3, $4, $5, $6)",[
  vehicleId,
  userPhoneNumber,
  bookingDetails.date_from,
  bookingDetails.date_to,
  bookingDate,
  total_price
  ]);
  return;
}
async function hireDriver(hiringDetails, hiringDate, userPhoneNumber){
  hiringDetails.selected_driver = hiringDetails.selected_driver.split("$");
  const driverId = hiringDetails.selected_driver[0];
  const driverPricePerDay = parseInt(hiringDetails.selected_driver[1]);
  const start_date = new Date(hiringDetails.date_from);
  const end_date = new Date(hiringDetails.date_to);
  const difference_in_milliseconds = end_date.getTime() - start_date.getTime();
  const difference_in_days = Math.round(difference_in_milliseconds / (1000 * 60 * 60 * 24)) + 1;
  const total_price = difference_in_days * driverPricePerDay;
  await db.query("INSERT INTO hirings(driver_id, user_phone_number, from_date, to_date, hired_date, price) VALUES ($1, $2, $3, $4, $5, $6)",[
  driverId,
  userPhoneNumber,
  hiringDetails.date_from,
  hiringDetails.date_to,
  hiringDate,
  total_price
  ]);
  return;
}

// User GET routes
app.get("/",async (req,res)=>{
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
app.get("/vehicles", async (req,res)=>{
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
app.get("/drivers",async (req,res)=>{
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
app.get("/bookings",(req,res)=>{
    if(req.isAuthenticated() && req.user.type === "user"){
        res.render("bookings.ejs",{
            "isLoggedIn": true
        });
    }else{
        res.redirect("/");
    }
});
app.get("/history",async (req,res)=>{
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
app.get("/bookingpage",async (req,res)=>{
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
app.get("/hiring",async (req,res)=>{
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
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});

// Admin GET routes
app.get("/adminhome",async (req,res)=>{
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
app.get("/admindrivers",async (req,res)=>{
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
app.get("/adminbookings",async (req,res)=>{
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
app.get("/removevehicle/:id", async (req,res) => {
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
app.get("/addvehicle/:id", async (req,res) => {
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
app.get("/removedriver/:id", async (req,res) => {
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
app.get("/adddriver/:id", async (req,res) => {
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
app.get("/adminlogin",(req,res)=>{
    res.render("admin-login.ejs");
});
app.get('/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/login'); 
    });
});


// Admin POST routes

app.post("/addvehicle", upload.single("vehicleImage"), async (req, res) => {
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
app.post("/adddriver", upload.single("driverImage"), async (req, res) => {
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

// user POST requests
app.post("/bookvehicle", async (req,res) => {
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
app.post("/hiredriver", async (req,res) => {
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
app.post("/login/:type", (req, res, next) => {
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

// passport strategy for user authentication
passport.use("user",new Strategy(async function verify(username, password, cb){
    try {
      const result = await db.query("SELECT * FROM users WHERE phone_number = $1", [
        username
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        user.type="user";
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
        return cb(null,false);
      }
    } catch (err) {
      return cb(err);
    }
}));
passport.use("admin",new Strategy(async function verify(username, password, cb){
    console.log("In admin strategy");
    try {
      const result = await db.query("SELECT * FROM admins WHERE admin_id = $1", [
        username
      ]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        user.type="admin";
        const storedHashedPassword = user.admin_password;
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
        return cb(null,false);
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