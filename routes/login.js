var express = require('express');
var router = express.Router();
const bcrypt = require('bcryptjs');//encript passwords
var session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const mongoURL = 'mongodb://127.0.0.1:27017/sessions';//url of the database
const UserModel = require('C:/Users/Alexa/Documents/prueba/models/User');//model of users

var app = express();

//Database
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(res => {
        console.log('MongoDB Connected');
    });

const store = new MongoDBSession({
    uri: mongoURL,
    collection: 'mySessions',
});

//cookies
router.use(session({
    secret: 'Key that will sign cookie',
    resave: false,
    saveUninitialized: false,
    store: store,
}));

const isAuth = (req, res, next) => {
    if(req.session.isAuth){
        res.redirect('/');
    } else {
        next()
    }
}

router.get('/', isAuth ,(req,res) => {
    res.render('log');
});

//obtiene los datos de formularios y los guarda en la base de datos
router.post('/', async(req, res) => {
    const { email, password } = req.body;
    //look for the user on the database
    const user = await UserModel.findOne({email});
    //if the user wasn't found
    if(!user){
        return res.redirect('/login');
    }
    //check if the password match
    const isMatch = await bcrypt.compare(password,user.password);
    //if the password doesn't match
    if(!isMatch){
        return res.redirect('/login');
    }

    req.session.isAuth = true;
    req.session.email = email;
    res.redirect('/');
});

module.exports = router;