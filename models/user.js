const {Schema, model} = require('mongoose');

const UserSchema = Schema({
    id: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
});

module.exports = model('User', UserSchema);