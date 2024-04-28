import db from "./database.js";
import fs from "fs";
import sharp from "sharp";

// Functions
export async function getAllAvailableVehicles(){
  const result = await db.query("SELECT * FROM vehicles WHERE availability='T';");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getAllUnavailableVehicles(){
  const result = await db.query("SELECT * FROM vehicles WHERE availability='F';");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getAllAvailableDrivers(){
  const result = await db.query("SELECT * FROM drivers WHERE availability='T' ORDER BY experience DESC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getAllAvailableDriversInOrder(){
  const result = await db.query("SELECT * FROM drivers WHERE availability='T' ORDER BY driver_id ASC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getAllUnavailableDrivers(){
  const result = await db.query("SELECT * FROM drivers WHERE availability='F';");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getVehicleBookings(username){
  const result = await db.query("SELECT B.booking_id, B.user_phone_number,TO_CHAR(B.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(B.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(B.booked_date, 'DD-MM-YYYY') AS booked_date, B.price AS total_price, V.vehicle_id, V.vehicle_model, V.launched_year, V.seating_capacity, V.milage, V.price_per_day, V.transmission_type, V.vehicle_type, V.vehicle_image_path FROM bookings B JOIN vehicles V ON  B.vehicle_id = V.vehicle_id WHERE B.user_phone_number = $1 ORDER BY booked_date DESC;",[
    username
  ]);
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getAllVehicleBookings(){
  const result = await db.query("SELECT B.booking_id, B.user_phone_number,TO_CHAR(B.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(B.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(B.booked_date, 'DD-MM-YYYY') AS booked_date, B.price AS total_price, V.vehicle_id, V.vehicle_model, V.launched_year, V.seating_capacity, V.milage, V.price_per_day, V.transmission_type, V.vehicle_type, V.vehicle_image_path FROM bookings B JOIN vehicles V ON  B.vehicle_id = V.vehicle_id ORDER BY booked_date DESC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getDriverHirings(username){
  const result = await db.query("SELECT H.hiring_id, H.user_phone_number,TO_CHAR(H.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(H.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(H.hired_date, 'DD-MM-YYYY') AS hired_date, H.price AS total_price, D.driver_id, D.driver_name, D.gender, D.age, D.price_per_day, D.driver_image_path, D.drivable_vehicles, D.experience FROM Hirings H JOIN Drivers D ON  H.driver_id = D.driver_id WHERE H.user_phone_number = $1 ORDER BY hired_date DESC;",[
    username
  ]);
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getAllDriverHirings(){
  const result = await db.query("SELECT H.hiring_id, H.user_phone_number,TO_CHAR(H.from_date, 'DD-MM-YYYY') AS from_date, TO_CHAR(H.to_date, 'DD-MM-YYYY') AS to_date, TO_CHAR(H.hired_date, 'DD-MM-YYYY') AS hired_date, H.price AS total_price, D.driver_id, D.driver_name, D.gender, D.age, D.price_per_day, D.driver_image_path, D.drivable_vehicles, D.experience FROM Hirings H JOIN Drivers D ON  H.driver_id = D.driver_id ORDER BY hired_date DESC;");
  if(result.rowCount > 0){
    return result.rows;
  }else{
    return -1;
  }
}
export async function getActiveAndPrevious(bookings){
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

export async function addVehicle(vehicleDetails,fullVehicleImagePath){
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
export async function addDriver(driverDetails, fullDriverImagePath){
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
export async function setVehicleAvalibilityFalse(vehicleId){
  await db.query("UPDATE vehicles SET availability='F' WHERE vehicle_id=$1",[
    vehicleId
  ]);
  return;
}
export async function setVehicleAvalibilityTrue(vehicleId){
  await db.query("UPDATE vehicles SET availability='T' WHERE vehicle_id=$1",[
    vehicleId
  ]);
  return;
}
export async function setDriverAvalibilityFalse(driverId){
  await db.query("UPDATE drivers SET availability='F' WHERE driver_id=$1",[
    driverId
  ]);
  return;
}
export async function setDriverAvalibilityTrue(driverId){
  await db.query("UPDATE drivers SET availability='T' WHERE driver_id=$1",[
    driverId
  ]);
  return;
}
export async function bookVehicle(bookingDetails, bookingDate, userPhoneNumber){
  bookingDetails.selected_vehicle = bookingDetails.selected_vehicle.split("$");
  const vehicleId = parseInt(bookingDetails.selected_vehicle[0]);
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
export async function hireDriver(hiringDetails, hiringDate, userPhoneNumber){
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