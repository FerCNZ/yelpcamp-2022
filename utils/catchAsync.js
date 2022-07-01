module.exports = func => {
    return (req, res, next) => {
        func (req, res, next).catch(next);
    }
}

// func is what you pass in and returna new function that has func excecuted and catches any error
// and passes into next.


