var express = require('express');
var router = express.Router();
var session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);
const mongoose = require('mongoose');
const mongoURL = 'mongodb://127.0.0.1:27017/sessions';//url of the database
const UserModel = require('C:/Users/Alexa/Documents/prueba/models/Perfiles');//model of profiles
var multer = require('multer');

router.use(express.static('public'));

var Storage = multer.diskStorage({
    destination:"./public/uploads/",
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

var upload = multer({
    storage:Storage
}).single('file');

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
    if(req.session.email === 'Alexa@gmail.com'){
        console.log(req.session.email)
        next()
    } else {
        res.redirect('/');
    }
}

router.get('/nuevo', isAuth, (req,res) => {
    res.render('perfil');
});

router.get('/', async(req,res) => {
    var nombre = null;
    var per = await UserModel.find({});
    res.render('details.ejs',{details:per});
});

module.exports = router;