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

router.get('/', isAuth, (req,res) => {
    res.render('reg');
});

router.post('/', async (req,res) => {
    const { username, email, password } = req.body;

    //if the user exist
    let user = await UserModel.findOne({email});
    if (user){
        return res.redirect('/register');
    }
    //encripta la contraseña antes de guardarla
    const hashedPsw = await bcrypt.hash(password, 12);
    // guarda el nuevo usuario en un modelo
    user = new UserModel({
        username,
        email,
        password: hashedPsw
    });
    //guarda el modelo en la base de datos
    await user.save();
    res.redirect('/login');
});

module.exports = router;