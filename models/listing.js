
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: { type: String, required: true },        // Title is mandatory
    description: { type: String, required: true }, // Description is mandatory
    image: { 
    filename:{type:String , default:true},
    url: { type: String, 
        default: "https://unsplash.com/photos/the-sun-is-shining-over-a-mountain-lake-5wbOSyxmD4c"  ,
        // Default image if no value is provided
        set: (value) => value || "https://unsplash.com/photos/the-sun-is-shining-over-a-mountain-lake-5wbOSyxmD4c" ,}
    },
    price: { type: Number, required: true, min: 0 }, // Price must be non-negative
    location: { type: String, required: true },      // Location is mandatory
    country: { type: String, required: true }        // Country is mandatory
});

// Create the model
const Listing = mongoose.model("Listing", listingSchema);

// Export the model
module.exports = Listing;
