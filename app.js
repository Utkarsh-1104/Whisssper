require('dotenv').config()
const express = require("express")
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
//const encrypt = require('mongoose-encryption')        //encrypting the password using mongoose-encryption
//const md5 = require('md5')                //hashing the password using md5
// const bcrypt = require('bcrypt')         //hashing and salting the password using bcrypt
// const saltRounds = 10
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')

const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
const URI = process.env.MONGODB_URI

async function main () {
    app.use(session({
        secret: process.env.SECRET,
        resave: false, 
        saveUninitialized: false
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    mongoose.connect(URI)
    
    const userSchema = new mongoose.Schema({
        email: String,
        password: String,
        googleId: String,
        secret: String
    })
    //encrypting the password using mongoose-encryption
    // const secret = process.env.SECRET
    // userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})

    userSchema.plugin(passportLocalMongoose)
    userSchema.plugin(findOrCreate)

    const User = new mongoose.model('User', userSchema)

    passport.use(User.createStrategy());

    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
          });
        });
      });
      
      passport.deserializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null, user);
        });
      });

    passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "https://whisper-bed6.onrender.com/auth/google/secrets"
      },
      function(accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
          return cb(err, user);
        });
      }
    ));

    app.get('/', (req, res) => {
        res.render('home')
    } )

    app.post('/auth/google',
        passport.authenticate('google', { scope: ['profile'] })
    );

    app.get('/auth/google/secrets', 
        passport.authenticate('google', { failureRedirect: '/login' }),
        function(req, res) {
            // Successful authentication, redirect secrets.
            res.redirect('/secrets');
    });
    
    app.get('/login', (req, res) => {
        res.render('login')
    })
    
    app.get('/register', (req, res) => {
        res.render('register')
    })
    
    app.get('/secrets', async (req, res) => {
        try {
            const foundUser = await User.find({secret: {$ne: null}})
            if(foundUser) {
                res.render('secrets', {usersWithSecrets: foundUser})
            }
        } catch (error) {
            res.send(error.message)
        }
    })

    app.get('/submit', (req, res) => {
        if(req.isAuthenticated()) {
            res.render('submit')
        }
        else {
            res.redirect('/login')
        }
    })

    app.post('/submit', async (req, res) => {
        const submittedSecret = req.body.secret
        try {
            const foundUser = await User.findById(req.user.id)
            if(foundUser) {
                foundUser.secret = submittedSecret
                foundUser.save()
                res.redirect('/secrets')
            }
        } catch (error) {
            res.send(error.message)
        }
    })

    app.post('/register', async (req, res) => {
        User.register({username: req.body.username}, req.body.password, function(err, user) {
            if(err) {
                res.redirect('/register')
            }
            else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/secrets')
                })
            }
        })

        // bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
        //     const newUser = new User({
        //         email: req.body.username,
        //         password: hash
        //     })
        //     try {
        //         await newUser.save()
        //         res.render('secrets')  
        //     } catch (error) {
        //         res.send(error.message)
        //     }
        // })
    })

    app.post('/login', async (req, res) => {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        })
        req.login(user, function(err) {
            if(err) {
                res.send(err)
            } else {
                passport.authenticate('local')(req, res, function() {
                    res.redirect('/secrets')
                })
            }
        })

        // const user = await User.findOne({email: req.body.username})
        // if (user) {
        //     bcrypt.compare(req.body.password, user.password, function(err, result) {
        //         if(result === true) {
        //             res.render('secrets')
        //         }
        //         else {
        //             res.send('Password is incorrect')
        //         }
        //     });
        // }
        // else {
        //     res.send('User not found')
        // }
    })

    app.get('/logout', (req, res) => {
        req.logout(function(err) {
            if (err) { 
                res.send(err)            
            }
            res.redirect('/');
        });
    })
}
main()
    app.listen(8080, () => {
        console.log('Server is running on port : http://localhost:8080');
    })