//THIS IS JUST TO SEE DATABASE


//Require files and modules

const mongoose = require('mongoose');
const cities = require('./cities');
const {places, descriptors} = require('./seedHelpers')
const Campground = require('../models/campground');


// Connect to database

mongoose.connect('mongodb://localhost:27017/yelp-camp',{
    useNewUrlParser: true, 
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Database connected");
});

// 

const sample = array => array[Math.floor(Math.random() * array.length)];   //review this!!!!

// Save 50 cities thorugh a loop using cities.js

const seedDB = async () => {
    await Campground.deleteMany({});
    for(let i = 0; i < 300; i++) {
        const random1000 = Math.floor(Math.random() * 1000) 
        const price = Math.floor(Math.random()* 20) + 10
        const camp = new Campground ({
            // YOUR USER ID
            author: '62b2794155c2131be1d67419',
            location: `${cities[random1000].city}, ${cities[random1000].state}`,  //reinforce this!!!!
            title: `${sample(descriptors)} ${sample(places)}`,
            description:  "Lorem ipsum dolor sit amet consectetur adipisicing elit. Cupiditate dolores iusto soluta ab quod in ipsam velit unde at quasi, fuga , fugiat",                
            price,
            geometry : { 
                type : "Point", 
                coordinates : [
                        cities[random1000].longitude,
                        cities[random1000].latitude
                        ]},
            images : [
                {
                  url: 'https://res.cloudinary.com/dn1kg0hla/image/upload/v1656374586/Yelpcamp/unlsqfbrikvokbcydjax.jpg',
                  filename: 'Yelpcamp/unlsqfbrikvokbcydjax'
                },
                {
                  url: 'https://res.cloudinary.com/dn1kg0hla/image/upload/v1656374587/Yelpcamp/ivw7nb1eysuiodqt16wt.jpg',
                  filename: 'Yelpcamp/ivw7nb1eysuiodqt16wt'
                }
              ]
        })
        await camp.save()   
    }
}
// Execute
seedDB().then(() => {
    mongoose.connection.close();
});