const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const MONGO_URL="mongodb://127.0.0.1:27017/wanderlust";
const methodoverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema } = require("./schema.js");

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended: true}));
app.use(methodoverride("_method"));
app.engine('ejs',ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log(err);
    });

async function main(){
    await mongoose.connect(MONGO_URL);
}

app.set("view engine","ejs");

app.get("/",(req,res) => {
    res.send("Hi,I am root");
});

const validateListing = (req,res,next) => {
    let { error } = listingSchema.validate(req.body);

    if(error){
        // let errMsg  = error.details.map((el) => el.message).join(",");
        console.log(error);
        throw new ExpressError(400,error); 
    }else{
        next();
    }
}
//Index Route
app.get("/Listings",wrapAsync(async (req,res) => {

   const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
})
);

//New Route
app.get("/listings/new",wrapAsync(async(req,res) => {
    res.render("listings/new.ejs")
})
);

//Show Route
app.get("/listings/:id",wrapAsync(async(req,res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/show.ejs",{listing});
})
); 

//Create Route
app.post("/Listings",validateListing,
wrapAsync(async(req,res,next) => {
    // let {title,description,image,price,country,location} = req.body;
    // let listing = req.body.Listing;
    // if(!req.body.listing){
    //     throw new ExpressError(400,"Send valid data for listing")
    // }
    // const newListing = new Listing(req.body.listing);
    // if(!newListing.title){
    //     throw new ExpressError(400,"Title is missing");
    // }
    // if(!newListing.location){
    //     throw new ExpressError(400,"Description is missing");
    // }
    //more good way to write
    const newListing = new Listing(req.body.listing);
    await newListing.save();
    res.redirect("/listings")
    })
); 

//Edit Route
app.get("/listings/:id/edit",wrapAsync(async (req,res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    res.render("listings/edit.ejs",{ listing })
})
);

//Update Route
app.put("/listings/:id",validateListing,wrapAsync(async(req,res) => {
    let {id}=req.params;
    await Listing.findByIdAndUpdate(id,{...req.body.listing});
    res.redirect(`/listings/${id}`);
})
);
//Delete Route
app.delete("/listings/:id",wrapAsync(async(req,res) =>{
    let {id} = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    res.redirect("/listings");
})
);
// app.get("/testListing", async (req,res) => {
//     let sampleListing = new Listing({
//         title: "My New Villa",
//         description: "By the beach",
//         price: 1200,
//         location: "Calangute,Goa",
//         country: "India",
//     });
//      await sampleListing.save();
//      console.log("sample was saved");
//      res.send("sucessful testing"); 
// })
app.all("*",(req, res, next) => {
    next(new ExpressError(404,"Page Not Found!"));
})

app.use((err,req,res,next) => {
    let {statusCode=500, message="Something went wrong!!"} = err;
    res.status(statusCode).render("error.ejs",{message});
    // res.status(statusCode).send(message);
})
app.listen(8000,() => {
    console.log("server is listening to port 8000")
});
