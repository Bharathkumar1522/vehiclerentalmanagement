import passport from "passport";
import { Strategy } from "passport-local";
import db from "./database.js";
import bcrypt from "bcrypt";

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

// export { user, admin };