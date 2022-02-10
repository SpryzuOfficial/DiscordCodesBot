const {Schema, model} = require('mongoose');

const CodeShema = Schema({
    name: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    },
});

module.exports = model('Code', CodeShema);