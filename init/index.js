const mongoose = require("mongoose");
const initdata = require("./data");
const Listing = require("../models/listing");
main()
.then(() => {
    console.log("connected to db");
})
.catch((err) => {
    console.log(err);
});

// Creating a database 
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/TravelHive');
}

const initDB = async () => {
    await Listing.deleteMany({});
    await Listing.insertMany(initdata.data);
    console.log("data was initialized");

};

initDB();
