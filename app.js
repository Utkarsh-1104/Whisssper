const express = require("express")
const bodyParser = require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')

const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))

async function main () {
    mongoose.connect('mongodb://localhost:27017/userDB')
    
    const userSchema = {
        email: String,
        password: String
    }
    
    const User = mongoose.model('User', userSchema)
    
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
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })
        try {
            await newUser.save()
            res.render('secrets')  
        } catch (error) {
            res.send(error.message)
        }
    })
}
main()
    app.listen(8080, () => {
        console.log('Server is running on port : http://localhost:8080');
    })