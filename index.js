if(process.env.NODE_ENV !="production"){
    require("dotenv").config();
}
const express = require("express");
const app =express();
const mongoose =require("mongoose");
const path =require("path");    
const ejsMate =require("ejs-mate");
const methodOverride =require("method-override");
const ExpressError =require("./utils/ExpressError.js");
const listings = require("./routes/listing.js");
const reviews = require("./routes/review.js");
const user  = require("./routes/user.js");
const session =require("express-session");
const MongoStore= require("connect-mongo");
const flash = require("connect-flash");
const passport =require("passport");
const LocalStrategy =require("passport-local");
const User =require("./Model/user.js");
const { env } = require("process");
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.json());
app.use(flash()); 
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
const dbUrl=process.env.ATLUSDB_URL;
main().then((res)=>console.log("connected to DB"))
.catch((err)=>console.log(err));
async function main(){
    await mongoose.connect(dbUrl);
};
app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
const store= MongoStore.create({
    mongoUrl:dbUrl,
    crypto:{
      secret:process.env.SECRET,
    },
    touchAfter:24*3600,
}); 
store.on("error",()=>{
    console.log("Error in MONGO SESSION STORE",err);
});
const sessionOptions ={
    store,
    secret :process.env.SECRET,
    resave:false,
    saveUninitialized:true,
    cookie : {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7*24*60*60*1000,
    },
};
app.use(session(sessionOptions));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success= req.flash("success");
    res.locals.error= req.flash("error");
    res.locals.currUser= req.user;
    next();
});
app.use("/listings",listings);
app.use("/listings/:id/reviews",reviews);
app.use("/",user);





// app.get("/",(req,res)=>{
//     res.send("I am root");
// });



app.all("*",(req,res,next)=>{
    next(new ExpressError(404,"Page Not Found!....."))
})

app.use((err,req,res,next)=>{
    let {statusCode =500 ,message="Some thing went wrong!..."} =err;
    res.status(statusCode).render("./listings/error.ejs",{message});
});

app.listen(8080,()=>{
    console.log("listing on port 8080");
})