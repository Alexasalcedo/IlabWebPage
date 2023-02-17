var express = require('express');
var router = express.Router();

//comprueba si el user esta logeado
const check = (req, res, next) => {
    if(req.session.isAuth){
        return true
    } else {
        return false 
    }
}

router.get('/', (req, res) => {
    const email = req.session.email;
    console.log(email)
    res.render('base',{check:check});
});


module.exports = router;