const Campground = require('../models/campground');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding"); //require geocoding
const mapBoxToken = process.env.MAPBOX_TOKEN   // save token to a variable
const geocoder = mbxGeocoding({ accessToken: mapBoxToken })  // we pass the token when we instantiate a new location
const { cloudinary } = require('../cloudinary');


module.exports.index = async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds})
}

module.exports.renderNewForm = (req, res) => {
    res.render('campgrounds/new')
}

module.exports.createCampground = async (req, res, next) => {
    const geoData = await geocoder.forwardGeocode({
        query: req.body.campground.location,
        limit: 1
    }).send()
    const campground = new Campground(req.body.campground)
    campground.geometry = geoData.body.features[0].geometry  // error to be handled ex if no result flash a message
    campground.images = req.files.map(f => ({url: f.path, filename: f.filename})) // map array added to req.files  and take the path and file name, make a new object for each one and put that in a new array, add that to campground and then save it 
    campground.author = req.user._id
    await campground.save()
    console.log(campground)
    req.flash('success', 'Sucessfully made a new campground!');
    res.redirect(`/campgrounds/${campground._id}`)  
}

module.exports.showCampground =  async (req, res) =>{ // this gets from the website address tab the 
    //& saves in a variable 
    const campground = await Campground.findById(req.params.id).populate({
        path:'reviews',  //populate all reviews
        populate: {     // then populate in each one of them their author
            path: 'author'
        }
    }).populate('author');   // populate the author of the campground                             
    if(!campground){
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/show', { campground });      // -> this line displays the show.ejs
}

module.exports.renderEditForm = async (req, res) => {
    const {id} = req.params;
    const campground = await Campground.findById(id)    //this variable is passed to the form  
    if(!campground){
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds')
    }
    res.render('campgrounds/edit', { campground });  
}

module.exports.updateCampground = async (req,res) => {
    const {id} = req.params;
    console.log(req.body)
    const campground = await Campground.findByIdAndUpdate(id, {...req.body.campground}, )
    const imgs = req.files.map(f => ({url: f.path, filename: f.filename}));
    campground.images.push(...imgs) // map array added to req.files  and take the path and file name, make a new object for each one and put that in a new array, add that to campground and then save it 
    await campground.save()
    if(req.body.deleteImages) {
        for(let filename of req.body.deleteImages){
            await cloudinary.uploader.destroy(filename)
        }
        await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages} } } })
        console.log(campground)
    }
    req.flash('success', 'Sucessfully updated campground!');
    res.redirect(`/campgrounds/${campground._id}`)
}

module.exports.deleteCampground = async (req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Campground sucessfully deleted');
    res.redirect('/campgrounds')
}