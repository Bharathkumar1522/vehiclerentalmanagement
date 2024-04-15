import express from "express";

const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/",(req,res)=>{
    res.render("index.ejs");
});
app.get("/carbooking",(req,res)=>{
    res.render("cars.ejs");
});
app.get("/driverbooking",(req,res)=>{
    res.render("drivers.ejs");
});
app.get("/bookings",(req,res)=>{
    res.render("bookings.ejs");
});
app.get("/login",(req,res)=>{
    res.render("login.ejs");
});
app.get("/history",(req,res)=>{
    res.render("history.ejs");
});
app.get("/bookingpage",(req,res)=>{
    res.render("booking-page.ejs");
});
app.get("/hiring",(req,res)=>{
    res.render("hiring.ejs");
});
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

app.listen(port, () => {
    console.log(`API is running at http://localhost:${port}`);
  });