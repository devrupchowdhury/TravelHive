const express = require("express");
const mongoose = require("mongoose");
const app = express();
const engine = require('ejs-mate');
const Listing = require("./models/listing");
const path = require("path");
const methodOverride = require("method-override");
app.set("view engine" , "ejs");
app.engine('ejs', engine);
// import password =>
const passport = require("passport");
const LocalStrategy = require("passport-local");
const session = require("express-session");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const User = require("./models/user"); // Import User model (you’ll create this next)

app.set("views" , path.join(__dirname,"views"));
app.use(express.static(path.join(__dirname , "public")));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
const wrapAsync = require("./utils/wrapAsync");
const Expresserror = require("./utils/Expresserror");
const {listingSchema} = require("./schema");



// configure sessions to user sessions

app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    next();
});

// transporter=>
    const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
            user: "your-email@gmail.com",  // Replace with your Gmail
            pass: "your-email-password"   // Replace with your Gmail App Password
        }
    }); 


// Creating a database 
async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/TravelHive');
}
main().catch(err => console.log(err));

app.get("/" , (req,res)=>{
    res.render("home.ejs");
})
const validateListing = (req,res,next) =>{
    let {error} = listingSchema.validate(req.body);
    console.log(error);
    if(error){
        throw new Expresserror(400 , error);
    }else{
        next();
    }
}
// register 
app.get("/register", (req, res) => {
    res.render("auth/register");
});

app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const user = new User({ username, email, verified: false });
        const registeredUser = await User.register(user, password);

        const token = crypto.randomBytes(32).toString("hex");
        user.verificationToken = token;
        await user.save();

        const verificationLink = `http://localhost:8080/verify/${token}`;
        await transporter.sendMail({
            to: email,
            subject: "Email Verification",
            text: `Click here to verify your email: ${verificationLink}`
        });

        res.send("Check your email to verify your account.");
    } catch (error) {
        res.send("Error registering user: " + error.message);
    }
});


// Email verification 
app.get("/verify/:token", async (req, res) => {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) return res.send("Invalid verification link.");

    user.verified = true;
    user.verificationToken = undefined;
    await user.save();

    res.send("Email verified! You can now log in.");
});

//Login & Logout Routes
app.get("/login", (req, res) => {
    res.render("auth/login");
});

app.post("/login", passport.authenticate("local", {
    successRedirect: "/listings",
    failureRedirect: "/login"
}));

app.get("/logout", (req, res) => {
    req.logout(() => {
        res.redirect("/");
    });
});


//  Forgot Password Route
app.get("/forgot-password", (req, res) => {
    res.render("auth/forgot-password");
});

app.post("/forgot-password", async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.send("User not found");

    const token = crypto.randomBytes(32).toString("hex");
    user.resetToken = token;
    await user.save();

    const resetLink = `http://localhost:8080/reset-password/${token}`;
    await transporter.sendMail({
        to: user.email,
        subject: "Password Reset",
        text: `Click here to reset your password: ${resetLink}`
    });

    res.send("Check your email for the password reset link.");
});

//  Reset Password Route
app.get("/reset-password/:token", async (req, res) => {
    res.render("auth/reset-password", { token: req.params.token });
});

app.post("/reset-password/:token", async (req, res) => {
    const user = await User.findOne({ resetToken: req.params.token });
    if (!user) return res.send("Invalid reset token");

    user.setPassword(req.body.password, async () => {
        user.resetToken = undefined;
        await user.save();
        res.send("Password reset successful! You can now log in.");
    });
});

// Protect Routes
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        return res.redirect("/login");
    }
    next();
};



// Index Route
app.get("/listings" , async(req,res) => {
   const allListings =  await Listing.find({});
   res.render("index.ejs" , {allListings});
});

// New Route
app.get("/listings/new" , (req,res) => {
  res.render("listings/new.ejs");
});
// Create Route => 
app.post("/listings" , isLoggedIn ,  wrapAsync(async(req,res ,next) => {
     console.log(req.body);
        const  newlisting = new Listing(req.body.listing);
        await newlisting.save();
        res.redirect("/listings");
}));

app.get("/listings/:id" , wrapAsync(async(req,res) =>{
    let {id} = req.params;
   const listing = await Listing.findById(id);
   res.render("show.ejs" , {listing});
   
}));

//Edit Route
app.get("/listings/:id/edit" , isLoggedIn ,  wrapAsync(async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs" , {listing});
}));

// Update Route 
app.put("/listings/:id",isLoggedIn, wrapAsync(async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body.listing;

    // Fetch the current listing to check the existing image
    const listing = await Listing.findById(id);

    // If no new image URL is provided, retain the current image
    if (!updatedData.image) {
        updatedData.image = listing.image;
    }

    // Update the listing with the new or retained data
    await Listing.findByIdAndUpdate(id, updatedData, { new: true, runValidators: true });
    res.redirect("/listings");
}));



// Delete Route => 
app.delete("/listings/:id" ,  isLoggedIn , wrapAsync( async(req,res) => {
    let {id} = req.params;
   let deletedlisting =  await Listing.findByIdAndDelete(id);
   console.log(deletedlisting);
   res.redirect("/listings");


}));




app.all("*" , (req,res,next) => {
    next(new Expresserror(404 , "Page not found!!"));
});
 // middleware => 
app.use((err, req, res, next) => {
    const { statusCode = 500, message = "Something went wrong!!" } = err;
    // Render the error page, making sure to set the status first
    res.status(statusCode).render("error.ejs", { err });
});



app.listen(8080 , () => {
    console.log("server is listening to port 8080");
})