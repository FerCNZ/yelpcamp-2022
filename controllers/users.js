const User = require('../models/user')

module.exports.renderRegister = (req, res) => {
    res.render('users/register')
}

module.exports.register = async (req, res,next  ) =>{
    try {
        const {email, username, password} = req.body  // get info destructured from req.body
        const user = new User({email, username}) //save email and user
        const registerUser = await User.register(user, password); // register user and hash password
        req.login(registerUser, err => { // keep user logged in once registered (no await supported)
            if(err) return next(err)
            req.flash('success','Welcome to Yelp Camp!')   // show flash message
            res.redirect('/campgrounds')  //redirect
        })
        
    } catch (e) {                // catch error
        req.flash('error', e.message);
        res.redirect('register')
    } 
}

module.exports.renderLogin = (req, res) => {
    res.render('users/login');
}

module.exports.login = (req, res) => {
    req.flash('success', "Welcome back!");
    const redirectUrl = req.session.returnTo || '/campgrounds';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
}

module.exports.logout = (req,res) => {
    req.logout(function(err){
        if(err) {return next(err);}
        req.flash('success', 'Goodbye!')
    res.redirect('/campgrounds')
    });
    
}