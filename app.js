var express = require('express');
var multer = require('multer');//libreria que guarda las imagenes(perfiles) en una carpeta

//youtube
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

//youtube
const axios = require('axios')
const hbs = require('hbs')
const fs = require('fs')


const searchTemp = hbs.handlebars.compile(fs.readFileSync('views/searchResults.hbs').toString('utf-8'))

const bcrypt = require('bcryptjs');//encriptar
var session = require('express-session');
const MongoDBSession = require('connect-mongodb-session')(session);//base de datos guarda las sesiones y cookies
const mongoose = require('mongoose');//para funciones que requieren de mongo
const mongoURL = 'mongodb://127.0.0.1:27017/sessions';//url de la database

const UserModel = require('C:/Users/Alexa/Documents/prueba/models/Perfiles');//model of profiles
const EventModel = require('C:/Users/Alexa/Documents/prueba/models/Eventos');//model of eventos
const ProjectModel = require('C:/Users/Alexa/Documents/prueba/models/Proyectos');//model of profiles
const MemberModel = require('C:/Users/Alexa/Documents/prueba/models/Integrante');//model of eventos

var registerRouter = require('./routes/register.js');//route de register
var loginRouter = require('./routes/login.js');// route de login

//Database
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    //Si la coneccion sale bien se imprime en pantalla
    .then(res => {
        console.log('MongoDB Connected');
    });

//Database cookies(ve quien tiene permiso y quien no)
const store = new MongoDBSession({
    uri: mongoURL,
    collection: 'mySessions',
});

var app = express();
app.set('views', 'views');//Carpeta donde busca plantillas
app.set('view engine', 'hbs');//view engine que utiliza
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));//carpeta de archivos estaticos

//Donde y como se guardan las imagenes de perfiles
var Storage = multer.diskStorage({
    destination:"./public/uploads/",
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    }
});

//funcion que obtiene el archivo del metodo post y la pasa otra funcion para guardarla
var upload = multer({
    storage:Storage
}).single('img');

//youtube
app.use(logger('dev'));
app.use(cookieParser());

app.use('/register', registerRouter);
app.use('/login', loginRouter);

// catch 404 and forward to error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 404);
    res.render('error.hbs');
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
  
    // render the error page
    res.status(err.status || 500);
    res.render('error.hbs');
});

//cookies
app.use(session({
    secret: 'Key that will sign cookie',
    resave: false,
    saveUninitialized: false,
    store: store,
}));

//Comprueba que un usuario este autorizado
const isAuth = (req, res, next) => {
    if(req.session.email === 'Alexa@gmail.com'){
        next()
    } else {
        res.redirect('/login');
    }
}

//Pagina de inicio
app.get('/', (req, res) => {
    const email = req.session.email;
    let check;
    if(req.session.isAuth){
        check = true;
    }
    res.render('base',{check:check,email:email});
});


/**
* Fn to hit the google translation API
* @param {*} queryObject 
* @returns translated text object
*/

// optiene los videos de youtube
const fetchVideos = async (queryObject) => {
    queryObject.channelId = 'UCg8HyuoSJE_quiyDhJmvtJw';
    const options = {
      method: 'GET',
      url: `https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=21&channelId=${queryObject.channelId}&key=AIzaSyD2ZiuNlCi8nnebiIeCJ2quEXPIWHrH4N4`,
    };
    const result = await axios(options)
    return result.data
}
  
  
/* API to fetch the translations */
app.post('/fetch_videos', async (req, res) => {
    try {
      const fetchedVideos = await fetchVideos(req.body)
      const html = searchTemp({
        result: fetchedVideos.items
      })
      res.send({
        html,
      })
    } catch (err) {
      console.log(err);
    }
})

//logout de usuarios
app.get('/logout', (req,res) => {
    req.session.destroy((err) => {
        if(err) throw err;
        res.redirect('/')
    });
});

//Galeria
var Gallery = require('express-photo-gallery');

var options = {
  title: 'Galeria'
};

app.use('/photos', Gallery('./public/images', options));

//crea un perfil de staff nuevo
app.get('/perfiles/nuevo', isAuth, (req,res) => {
    res.render('perfil');
});

//muestra los perfiles de staff ya creados
app.get('/perfiles', async(req,res) => {
    const email = req.session.email;
    let check;
    if(req.session.isAuth){
        check = true;
    }
    var per = await UserModel.find({});
    let autorizar;
    if(req.session.email === 'Alexa@gmail.com'){
        autorizar = true;
    }
    res.render('details.ejs',{details:per,check:check,email:email,autorizado:autorizar});
});

//obtiene la informacion deun perfil de usuario nuevo y la guarda en la base de datos
app.post('/perfiles', upload, async(req,res) => {
    const { nombre, apellido, email, experiencia, texto, rol } = req.body;
    let img;
    if(req.file){
        img = req.file.filename;
    }
    // guarda el nuevo perfil en un modelo
    user = new UserModel({
        nombre,
        apellido,
        email,
        experiencia,
        texto,
        img,
        rol,
    });
    //guarda el modelo en la base de datos
    await user.save();
    res.redirect('/');
});

//Renderiza la pantalla para borrar perfiles
app.get('/borrar', async(req,res) => {
    res.render('borrar')
});

//borra perfiles de staff
app.post('/borrar_perfil', async(req,res) => {
    const { nombre } = req.body;
    var perfiles = await UserModel.deleteOne({nombre:nombre});
    res.redirect('/');
});

//renderiza form para nuevos eventos
app.get('/eventos/nuevo', isAuth, (req,res) => {
    res.render('Eventos');
});

//guarda un nuevo evento en la base
app.post('/eventos', upload, async(req,res) => {
    const { tema, fecha, duracion, modalidad, descripcion } = req.body;
    let img;
    if(req.file){
        img = req.file.filename;
    }
    // guarda el nuevo perfil en un modelo
    user = new EventModel({
        tema,
        fecha,
        duracion,
        modalidad,
        descripcion,
        img,
    });
    //guarda el modelo en la base de datos
    await user.save();
    res.redirect('/');
});

//obtiene los eventos de la base y los muestra 
app.get('/eventos', async(req,res) => {
    const email = req.session.email;
    let check;
    if(req.session.isAuth){
        check = true;
    }
    const sort = {fecha:1}
    var per = await EventModel.find({}).sort(sort);
    let autorizar;
    if(req.session.email === 'Alexa@gmail.com'){
        autorizar = true;
    }
    res.render('events.ejs',{details:per,check:check,email:email,autorizado:autorizar});
});

//renderiza la plantilla para borrar eventos
app.get('/borrar_eventos', async(req,res) => {
    res.render('borrar_evento')
});

//borra el evento
app.post('/borrar_evento', isAuth, async(req,res) => {
    const { tema } = req.body;
    var perfiles = await EventModel.deleteOne({tema:tema});
    res.redirect('/');
});

//renderiza la plantilla para editar eventos
app.get('/edit_eventos', async(req,res) => {
    res.render('edit_eventos')
});

//actuariza la base de datos de los eventos
app.post('/edit_eventos', async(req,res) => {
    const { temav, teman, fecha, duracion, modalidad, descripcion } = req.body;
    if(fecha != ''){
        await EventModel.updateOne({tema:temav},{fecha:fecha})
    }
    if(duracion != ''){
        await EventModel.updateOne({tema:temav},{duracion:duracion})
    }
    if(modalidad != ''){
        await EventModel.updateOne({tema:temav},{modalidad:modalidad})
    }
    if(descripcion != ''){
        await EventModel.updateOne({tema:temav},{descripcion:descripcion})
    }
    if(teman != ''){
        await EventModel.updateOne({tema:temav},{tema:teman})
    }
    res.redirect('/');
});

//muestra los proyectos
app.get('/proyectos', async(req,res) => {
    const email = req.session.email;
    let check;
    if(req.session.isAuth){
        check = true;
    }
    var proyectos = await ProjectModel.find({});
    var integrantes = await MemberModel.find({});

    let autorizar;
    if(req.session.email === 'Alexa@gmail.com'){
        autorizar = true;
    }
    res.render('proyectos.ejs',{details:proyectos,integrantes:integrantes,check:check,email:email,autorizado:autorizar});
});

//crea un proyecto nuevo
app.get('/proyectos/nuevo', isAuth, (req,res) => {
    res.render('nuevo_proyecto');
});

//obtiene la informacion deun perfil de usuario nuevo y la guarda en la base de datos
app.post('/proyectos', upload, async(req,res) => {
    const { nombre, descripcion } = req.body;
    // guarda el nuevo perfil en un modelo
    user = new ProjectModel({
        nombre,
        descripcion,
    });
    //guarda el modelo en la base de datos
    await user.save();
    res.redirect('/proyectos');
});

//crea un nuevo integrante a un proyecto
app.get('/integrantes/nuevo', isAuth, (req,res) => {
    res.render('nuevo_integrante');
});

//obtiene la informacion deun perfil de usuario nuevo y la guarda en la base de datos
app.post('/integrantes', upload, async(req,res) => {
    const { nombre_proyecto, integrante, correo, carrera} = req.body;
    // guarda el nuevo perfil en un modelo
    user = new MemberModel({
        nombre_proyecto,
        integrante,
        correo,
        carrera,
        img : req.file.filename,
    });
    //guarda el modelo en la base de datos
    await user.save();
    res.redirect('/proyectos');
});

//renderiza template para editar proyecto
app.get('/edit_proyectos', async(req,res) => {
    res.render('edit_proyectos')
});

//actualiza la base de datos de proyectos
app.post('/edit_proyectos', async(req,res) => {
    const { nombrev, nombren, descripcion } = req.body;
    if(descripcion != ''){
        await ProjectModel.updateOne({nombre:nombrev},{descripcion:descripcion})
    }
    if(nombren != ''){
        await ProjectModel.updateOne({nombre:nombrev},{nombre:nombren})
    }
    res.redirect('/proyectos');
});

//renderiza template para editar integrantes
app.get('/edit_integrante', async(req,res) => {
    res.render('edit_integrante')
});

//actualiza la base de datos de integrantes
app.post('/edit_integrante', async(req,res) => {
    const { integrantev, integranten, nombre_proyecto, correo, carrera } = req.body;
    if(nombre_proyecto != ''){
        await MemberModel.updateOne({integrante:integrantev},{nombre_proyecto:nombre_proyecto})
    }
    if(correo != ''){
        await MemberModel.updateOne({integrante:integrantev},{correo:correo})
    }
    if(carrera != ''){
        await MemberModel.updateOne({integrante:integrantev},{carrera:carrera})
    }
    if(integranten != ''){
        await MemberModel.updateOne({integrante:integrantev},{integrante:integranten})
    }
    res.redirect('/proyectos');
});

//renderiza template para borrar proyectos
app.get('/borrar_proyectos', async(req,res) => {
    res.render('borrar_proyectos')
});

//borra proyecto de base de datos
app.post('/borrar_proyectos', isAuth, async(req,res) => {
    const { nombre } = req.body;
    var perfiles = await ProjectModel.deleteOne({nombre:nombre});
    res.redirect('/');
});

//renderiza template de borrar integrante
app.get('/borrar_integrante', async(req,res) => {
    res.render('borrar_integrante')
});
//borra integrante de la base de datos 
app.post('/borrar_integrante', isAuth, async(req,res) => {
    const { integrante } = req.body;
    var perfiles = await MemberModel.deleteOne({integrante:integrante});
    res.redirect('/');
});

//puerto
app.listen(3000,() => {
    console.log("Express is running on port 3000");
});