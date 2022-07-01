const express = require('express')
const router = express.Router();
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, validateCampground, isAuthor} = require('../middleware')
const multer  = require('multer');
const {storage} = require('../cloudinary')    // storage is the object made in index.js in cloudinary folder
const upload = multer({ storage });
const Campground = require('../models/campground');
const campgrounds = require('../controllers/campgrounds')

router.route('/')
    .get(catchAsync (campgrounds.index)) // SHOW Home
    .post(isLoggedIn, upload.array('image'), validateCampground,  catchAsync (campgrounds.createCampground)) //new
    

router.get('/new', isLoggedIn ,campgrounds.renderNewForm)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground)) //show
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync (campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground)) //delete


router.get('/:id/edit' , isLoggedIn, isAuthor, catchAsync (campgrounds.renderEditForm))

module.exports = router;