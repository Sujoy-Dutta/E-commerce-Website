const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStrore = require('connect-mongodb-session')(session);

const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require("multer");
const mongoose = require('mongoose');

const errorController = require('./controllers/error');
//const mongoConnect = require('./util/database').mongoConnect;
const User = require('./models/user');

const MONGODB_URI = "mongodb+srv://sujoy_user1:sujoy_user1@cluster0.h8uwzta.mongodb.net/shop?retryWrites=true&w=majority";

const app = express();
const store = MongoDBStrore({
  uri: MONGODB_URI,
  collection: "sessions"
});//constructor

const csrfProtection = csrf();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb)=> {
    cb(null, 'images');
  },
  filename: (req, file, cb)=>{
    cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
  }
})

const fileFilter = (req, file, cb) =>{
  
  if( file .mimetype === 'image/png' || file .mimetype === 'image/jpg' || file .mimetype === 'image/jpeg'){
    cb(null, true);
  }else{
    cb(null, false);
  }
};

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./Routes/admin');
const shopRoutes = require('./Routes/shop');
const authRoutes = require('./Routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter : fileFilter}).single('image'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use(
  session({ 
    secret: 'my secret', 
    resave: false, 
    saveUninitialized: false, 
    store: store})
)

app.use(csrfProtection);
app.use(flash());

app.use((req,res,next)=>{
  res.locals.isAuthenticated= req.session.isLoggedIn;
  res.locals.csrfToken= req.csrfToken();
  next();
})

app.use((req, res, next)=>{
  if(!req.session.user){
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err)); 
    });
})



app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use('/500',errorController.get500);
app.use(errorController.get404);

app.use((error, req, res, next)=>{
    //res.redirect('/500');
    res.status(500).render('500', {
      pageTitle: 'Error!',
      path: '/500',
      isAuthenticated: req.session.isLoggedIn
  });
});

mongoose.connect(MONGODB_URI)
  .then(result =>{
  app.listen(3000);
  }).catch(err =>{
  console.log(err);
})


