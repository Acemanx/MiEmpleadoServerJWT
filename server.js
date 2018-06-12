// Set up
//Librerias
var express  = require('express');
var app      = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var base64Img = require('base64-img');
var fs = require('fs');
var path=require('path');

//Modelos
var Empleado = require('./models/empleado');
var User = require('./models/user');
var auth= require('./middleware/auth');

// Configuration
var router = express.Router();
mongoose.connect('mongodb://localhost:27017/Empleados');
 app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb',  extended: true
}));
var port = process.env.PORT || 3003;
var jwt = require('jwt-simple');
var moment = require('moment');
var confif = require('./config');

//Funcion Creación de Token
function createToken (user){
  var payload = {
    sub: user._id,
    //Fecha creacion del token
    iat: moment().unix(),
    //Duracion de caducidad
    exp: moment().add(14, 'days').unix(),
  }
  return jwt.encode(payload, confif.SECRET_TOKEN)
}
// Función Decifrar Token
function decodeToken(token){
  var decoded=new Promise((resolve,reject)=> {
    try{
      var payload2=jwt.decode(token, confif.SECRET_TOKEN)
      if(payload2.exp <= moment().unix()){
        reject({
          status:401,
          message: 'El token ha expirado'
        })
      }
      resolve(payload2.sub); 
    }catch(err){
      reject({
          status:500,
          message: 'Token Invalido'
        })
    }
  })
  return decoded;
}
//Middleware
function isAuth( req,res,next){
  if(!req.headers.authorization){
    return res.status(403).send({message: 'No tienes autorización'});
   //s console.log("pasó");
  }
  var token=req.headers.authorization.split(" ")[1];
  //console.log(token); //segundo elemento del array token
  decodeToken(token)
  .then(response=> {
    req.user=response
    next()
  })
  .catch(response =>{
    res.status(response.status)
  })

}
//Usuarios 
var UsersRoute= router.route('/Users');
UsersRoute.post(function(req,res){
var user = new User();
console.log(req.body[0]);
  User.find({Numid:req.body.numid}, (err,user) => {

    if (err) return res.status(500).send({message: err});
    if(user==""){
user.Numid = req.body.numid;
user.Contrasena=req.body.contrasena;

     var camaraimage=req.body.imagen;

     var imagenname= Date.now();
     base64Img.img(camaraimage, '../MiEmpleadoServerJWT/images',imagenname, function(err, filepath) {
      res.json({ message: 'imagen añadida' });  
     });

user.imagen= 'http://104.236.69.173:3003/api/camara/'+imagenname+".jpg";
user.save(function(err){
    if (err) res.status(500).send({message: 'Error al crear usuario ${err}'})

    res.status(200).send({token: createToken(user), data:user, message: 'Usuario creado'})
  });}else{
  res.status(200).send({token: createToken(user), data:user, message: 'El usuario ya existe'});
}
});});
//GET Ususarios
UsersRoute.get(isAuth,(req, res) => {
  // Use  model to find all 
  User.find(function(err, users) {
    if (err)
      res.send(err);

    res.json(users);
  });
});
var usuarioidRoute= router.route('/Users/:id_usuario');
usuarioidRoute.delete(isAuth,(req, res) => {
  // Use the Beer model to find a specific beer and remove it
  User.findByIdAndRemove(req.params.id_usuario, function(err) {
    if (err)
      res.send(err);

    res.json({ message: 'El usuario se ha eliminado!' });
  });
});
//Configuración de la cámara
var CamaraRoute2 = router.route('/camara/:archivo');
CamaraRoute2.get(function  (req,res){
  var archivo=req.params.archivo;
  var rutaArchivos='../MiEmpleadoServerJWT/images/'+archivo;
  console.log(rutaArchivos);
  fs.exists(rutaArchivos, function(exists){
    if(exists){
      res.sendFile(path.resolve(rutaArchivos))
    }else{
      res.status(200).send({message: 'no existe la imagen...'});
    }
  });
});
usersroute2=router.route('/Usuarios', isAuth);
usersroute2.get (isAuth,(req, res) =>{
res.status(200).send({message: 'Tienes acceso'});
});
// Login page
var LoginRoute=router.route('/Login');
LoginRoute.post(function(req,res){
  User.find({Numid:req.body.numid}, (err,user) => {

    if (err) return res.status(500).send({message: err});
    if(user=="") return res.status(200).send({message: 'No existe el usuario'});
    var usuario=user;
   // console.log(usuario);
   // console.log(user[0].Contrasena);
    if(req.body.contrasena==user[0].Contrasena){
    req.user=user;
  //  console.log(user);
    res.status(200).send({
      message: 'Ingresado al sistema',
      token:  createToken(user)
    });}else{

      res.status(200).send({message: 'Contraseña invalida'});
    }
  });
});

// Create our Express router

// Initial dummy route for testing
// http://localhost:3000/api
router.get('/', function(req, res) {
  res.json({ message: 'holahola' }); 
});

var EmpleadosRoute = router.route('/Empleados');
// Create endpoint /api/ for POSTS
EmpleadosRoute.post(isAuth,(req, res) => {
  // Create a new instance of the  model
  var empleado = new Empleado();
  console.log(req.body.tipo);
  // Set the  properties that came from the POST data
  empleado.Tipoid = req.body.tipo;
  empleado.Numid = req.body.numid;
  empleado.Nombres = req.body.nombres;
  empleado.Apellidos=req.body.apellidos;
  empleado.Edad=req.body.edad;
  empleado.Genero=req.body.genero;
  empleado.Cargo=req.body.cargo;
  
  // Save  and check for errors
  empleado.save(function(err) {
    if (err)
      res.send(err);

    res.json({ message: 'Empleado añadido', data: empleado });
  });
});
EmpleadosRoute.get(isAuth,(req, res) => {
  // Use  model to find all 
  Empleado.find(function(err, empleados) {
    if (err)
      res.send(err);

    res.json(empleados);
  });
});
var empleadoRoute = router.route('/empleados/:empleado_id');

// Create endpoint /api/empleados/:empleados for GET
empleadoRoute.get(isAuth,(req, res) => {
  // Use the Empleados model to find a specific empleado
  Empleado.findById(req.params.empleado_id, function(err, empleado) {
    if (err)
      res.send(err);

    res.json(empleado);
  });
});
empleadoRoute.put(isAuth,(req, res) => {
  // Use the Beer model to find a specific empleado
  Empleado.findById(req.params.empleado_id, function(err, empleado) {
    if (err)
      res.send(err);

    // Update the existing empleado 
  empleado.Tipoid = req.body.tipo;
  empleado.Numid = req.body.numid;
  empleado.Nombres = req.body.nombres;
  empleado.Apellidos=req.body.apellidos;
  empleado.Edad=req.body.edad;
  empleado.Genero=req.body.genero;
  empleado.Cargo=req.body.cargo;

    // Save the employee and check for errors
    empleado.save(function(err) {
      if (err)
        res.send(err);

      res.json({message:'Empleado actualizado correctamente',data:empleado});
    });
  });
});
///api/empleado/:empleado_id para DELETE
empleadoRoute.delete(isAuth,(req, res) => {
  // Use the Beer model to find a specific beer and remove it
  Empleado.findByIdAndRemove(req.params.empleado_id, function(err) {
    if (err)
      res.send(err);

    res.json({ message: 'El empleado se ha eliminado!' });
  });
});

app.use('/api', router);
app.use((req,res,next) => {
  //Con lo siguiente permitimos acceso a todos los dominios.
  res.header('Access-Control-Allow-Origin' , '*');
  //Para que funcione a nivel de Ajax
  res.header('Access-Control-Allow-Headers' , 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method  ');
  //Indicamos los metodos que se van a soportar
  res.header('Access-Control-Allow-Methods' , 'GET, POST, OPTIONS, PUT, DELETE');

  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
  //Salir del middleware y continuar con el flujo normal de ejecución, con una ruta concreta de un metodo de un controaldor
  next();
});

// Start the server
app.listen(port);