require('dotenv').config()
const express = require("express")
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
//const encrypt = require('mongoose-encryption')        //encrypting the password
//const md5 = require('md5')                //hashing the password using md5
const bcrypt = require('bcrypt')
const saltRounds = 10

const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))
const URI = process.env.MONGODB_URI

async function main () {
    mongoose.connect(URI)
    
    const userSchema = new mongoose.Schema({
        email: String,
        password: String
    })
    //encrypting the password
    // const secret = process.env.SECRET
    // userSchema.plugin(encrypt, {secret: secret, encryptedFields: ['password']})

    const User = new mongoose.model('User', userSchema)
    
    app.get('/', (req, res) => {
        res.render('home')
    } )
    
    app.get('/login', (req, res) => {
        res.render('login')
    })
    
    app.get('/register', (req, res) => {
        res.render('register')
    })
    
    app.post('/register', async (req, res) => {
        bcrypt.hash(req.body.password, saltRounds, async function(err, hash) {
            // Store hash in your password DB.
            const newUser = new User({
                email: req.body.username,
                password: hash
            })
            try {
                await newUser.save()
                res.render('secrets')  
            } catch (error) {
                res.send(error.message)
            }
        })
    })

    app.post('/login', async (req, res) => {
        const user = await User.findOne({email: req.body.username})
        if (user) {
            bcrypt.compare(req.body.password, user.password, function(err, result) {
                if(result === true) {
                    res.render('secrets')
                }
                else {
                    res.send('Password is incorrect')
                }
            });
        }
        else {
            res.send('User not found')
        }
    })
}
main()
    app.listen(8080, () => {
        console.log('Server is running on port : http://localhost:8080');
    })