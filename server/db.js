const mongoose = require('mongoose')
const url = 'mongodb://localhost:27017/movies'
mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true})

const top25Schema = new mongoose.Schema({
    pic: String,
    title: String,
    evaluate: String,
    labels: Array,
    rating: String,
    collected: Boolean
})
const top25Model = mongoose.model('top25', top25Schema)

module.exports = top25Model