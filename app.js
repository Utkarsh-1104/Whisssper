const express = require("express")
const bodyParser = require('body-parser')
const ejs = require('ejs')

const app = express()
app.set('view engine', 'ejs')
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}))

app.get('/', (req, res) => {
    res.render('home')
} )

app.listen(8080, () => {
    console.log('Server is running on port : http://localhost:8080');
})