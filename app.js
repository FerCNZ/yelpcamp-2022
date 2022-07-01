if(process.env.NODE_ENV !== "production") {      //to be used only during development of application
    require('dotenv').config();
}

//Require modules and files

const express = require('express');  // To use express
const path = require('path'); // to use path (path.join)
const mongoose = require('mongoose'); // to use database
const ejsMate = require('ejs-mate'); //Express partial and block template functions for the EJS template engine.
const session = require('express-session') // to set the session cookies
const flash = require('connect-flash')  // flash (flashing message once when achieveing something)
const ExpressError = require('./utils/ExpressError') // using class ExpressError
const methodOverride = require('method-override'); // Method override for POST when we want to delete
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const helmet = require('helmet');

const mongoSanitize = require('express-mongo-sanitize');



const userRoutes =  require('./routes/users')
const campgroundRoutes = require('./routes/campgrounds');  // require ruotes
const reviewRoutes = require('./routes/reviews');  // require ruotes
const MongoStore = require('connect-mongo');
const user = require('./models/user');


// USE MVC  (MODEL VIEW CONTROLLER) Models (db models) Views (display websites) 
// Controllers (where logic happens)

// CONNECT TO DATABASE

const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'


mongoose.connect(dbUrl ,{
    useNewUrlParser: true, 
    useUnifiedTopology: true,
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// EXECUTE EXPRESS

const app = express()

//SET / USE APP

app.engine('ejs', ejsMate)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))
app.use(express.urlencoded({extended: true}))  //parse encoded info from req body
app.use(methodOverride('_method'))
app.use(express.static(path.join(__dirname, 'public')))
app.use(
    mongoSanitize({
    replaceWith: '_',
  }),
  );


 //using mongo to store session

const secret = process.env.SECRET || 'thisshouldbeabettersecret!'

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret
    }
})  

store.on("error", function(e){
    console.log("session store error", e)
})

// Cookies configuration

const sessionConfig = {
    store,
    name: 'session',
    secret, //secret
    resave: false,  // why?
    saveUninitialized: true,  // why?
    cookie: {
        httpOnly: true,  //It means that cookies are only accesible through http not through Javascript
        // secure: true,  // this means that cookies can only be configured through https
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7, //exp date 1000 miliseconds, 60 sec, 60 min etc
        maxAge: 1000 * 60 * 60 * 24 * 7,   // ?? Why
    }
} 

app.use(session(sessionConfig))  // use express-session in app and pass above arg
app.use(flash());
// app.use(helmet())
 
const scriptSrcUrls = [
    "https://stackpath.bootstrapcdn.com/",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
    "https://res.cloudinary.com/dv5vm4sqh/"
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://stackpath.bootstrapcdn.com/",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css",
    "https://api.mapbox.com/mapbox-gl-js/v2.9.1/mapbox-gl.css",
    "https://res.cloudinary.com/dv5vm4sqh/"
    
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = ["https://res.cloudinary.com/dv5vm4sqh/"];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dn1kg0hla/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
            mediaSrc   : [ "https://res.cloudinary.com/dv5vm4sqh/" ],
            childSrc   : [ "blob:" ]
        },
    })
);

// PASSPORT CONFIGURATION

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()))  // we ask passport to use LocalStrategy which was 
// downloaded and required the authenticate methos is going to be located in our user model
//we dont have a authenticate method it comes from passport

passport.serializeUser(User.serializeUser()) // This is telling passport how to serialise a user
//how do we store a user in the session 
passport.deserializeUser(User.deserializeUser()) //how to get a user out of the session 


 


app.use((req, res, next) =>{
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success'); // in this way we have access to success in 
    res.locals.error = req.flash('error');     // in res.locals.success/error so we pass it in ejs
    next();                                    //see boilerplate <%= success%> <%=error%>
})     


//Hardcoding a creation of a new user

app.get('/fakeuser', async (req, res) => {
    const user = new User({email: 'coltttt@gmail.com', username: 'colttt'});
    const newUser = await User.register(user, 'chicken')
    res.send(newUser);
})

app.use('/' , userRoutes)
app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)

// ------ Home ------

app.get('/' ,(req, res) =>{
    res.render('home')
}) 

//Error handler

app.all('*', (req,res, next)  => {
    next(new ExpressError('Page not found' , 404))
} )

// NEXT

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err
    if(!err.message) err.message = 'Oh No! Something went wrong' 
    res.status(statusCode).render('error' , {err})
})

// LISTENING PORTS

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Serving on port ${port}`)
})

