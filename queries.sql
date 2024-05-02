CREATE TABLE users(
	name_ VARCHAR(100) NOT NULL,
	phone_number VARCHAR(10) PRIMARY KEY NOT NULL CHECK (phone_number ~ '^\d{10}$'),
	user_password TEXT NOT NULL
);
CREATE TABLE admins(
	admin_id VARCHAR(5) PRIMARY KEY NOT NULL,
	admin_password TEXT NOT NULL
);
CREATE TABLE vehicles(
	vehicle_id SERIAL PRIMARY KEY NOT NULL,
	vehicle_model VARCHAR(50) UNIQUE NOT NULL,
	launched_year INTEGER NOT NULL,
	seating_capacity INTEGER NOT NULL,
	milage NUMERIC NOT NULL,
	price_per_day NUMERIC NOT NULL,
	transmission_type VARCHAR(50) NOT NULL,
	vehicle_type VARCHAR(50) NOT NULL,
	vehicle_image_path TEXT NOT NULL,
	availability VARCHAR(1) DEFAULT 'T'
);
CREATE TABLE drivers(
	driver_id SERIAL PRIMARY KEY NOT NULL,
	driver_name VARCHAR(50) UNIQUE NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(1) NOT NULL,
    experience INTEGER NOT NULL,
    drivable_vehicles VARCHAR(20) NOT NULL,
	price_per_day NUMERIC NOT NULL,
	driver_image_path TEXT NOT NULL,
	availability VARCHAR(1) DEFAULT 'T'
);
CREATE TABLE bookings(
	booking_id SERIAL PRIMARY KEY,
	vehicle_id INTEGER NOT NULL REFERENCES vehicles(vehicle_id),
	user_phone_number VARCHAR(10) REFERENCES users(phone_number) NOT NULL,
	from_date DATE NOT NULL,
	to_date DATE NOT NULL,
	booked_date DATE NOT NULL,
	price NUMERIC NOT NULL
);
CREATE TABLE hirings(
	hiring_id SERIAL PRIMARY KEY,
	driver_id INTEGER NOT NULL REFERENCES drivers(driver_id),
	user_phone_number VARCHAR(10) REFERENCES users(phone_number) NOT NULL,
	from_date DATE NOT NULL,
	to_date DATE NOT NULL,
	hired_date DATE NOT NULL,
	price NUMERIC NOT NULL
);

INSERT INTO admins(admin_id, admin_password) VALUES ("VRMadmin@01", "$2b$15$YN8tpvJSqDLYHicnDZw96Ok8xABVQbtnaOU6BdMdIrp/73J6RvEFC");