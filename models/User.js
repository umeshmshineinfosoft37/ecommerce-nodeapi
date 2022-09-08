var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var userSchema = mongoose.Schema({
    email: {
        type: String,
        index: true
    },
    password: {
        type: String,
        required: true,
    },
    fullname: {
        type: String
    },
    admin: {
        type: String
    },

    Profile: {
        type: String,
        required: "Profile Picture is required!",
        select: false
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now }
});

userSchema.set('timestamps', true)

var User = module.exports = mongoose.model('User', userSchema);

module.exports.createUser = function(newUser, callback) {
    bcrypt.genSalt(10, function(err, salt) {
        bcrypt.hash(newUser.password, salt, function(err, hash) {
            newUser.password = hash;
            newUser.save(callback);
        });
    });
}

module.exports.getUserByEmail = function(email, callback) {
    var query = { email: email };
    User.findOne(query, callback);
}


module.exports.getUserById = function(id, callback) {
    User.findOne(id,{"password":0, "__v": 0,"updatedAt":0}, callback);
}
module.exports.comparePassword = function(givenPassword, hash, callback) {
    bcrypt.compare(givenPassword, hash, function(err, isMatch) {
        if (err) throw err;
        callback(null, isMatch);
    });                    
}


module.exports.getAllUsers = function(callback) {

    User.find(callback)
}


module.exports.UpdateProfilePic = function(userId, Profile, callback) {
    var query = { _id: userId };
    // User.findById(query, (err, user) => console.log("user------>", user))
    User.findOneAndUpdate({...query }, { $set: { Profile: Profile } }, callback)
}


module.exports.UpdateProfile = function(userId, ProfileData, callback) {
    // var query = { _id: userId }
    User.findByIdAndUpdate(userId, { $set: {...ProfileData } }, callback)
}