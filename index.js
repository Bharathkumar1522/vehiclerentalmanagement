import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import passport from "passport";
import routes from "./routes.js";

const app = express();
const port = 3000;

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

app.use(passport.initialize());
app.use(passport.session());

app.use("/",routes);

app.listen(port, () => {
  console.log(`API is running at http://localhost:${port}`);
});