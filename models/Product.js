var mongoose = require('mongoose');

var productSchema = mongoose.Schema({
    imagePath: {
        type: String
    },
    title: {
        type: String
    },
    description: {
        type: String
    },
    department: {
        type: String
    },
    category: {
        type: String
    },
    price: {
        type: Number
    },
    color: {
        type: String
    },
    size: {
        type: String
    },
    quantity: {
        type: Number
    },
    date: {
        type: Number
    },
    createdAt: { type: Date, required: true, default: Date.now },
    updatedAt: { type: Date, required: true, default: Date.now },

});

var Product = module.exports = mongoose.model('Product', productSchema);

module.exports.getAllProducts = function(query, sort, callback) {
    Product.find(query, {"__v": 0,"updatedAt":0,"createdAt":0}, sort, callback)
}

module.exports.getProductsId = function(query, callback) {
  Product.findById(query, {"__v": 0,"updatedAt":0,"createdAt":0}, callback)
}
module.exports.getProductByDepartment = function(query, sort, callback) {
    Product.find(query, null, sort, callback)
}

module.exports.getProductByCategory = function(query, sort, callback) {
    Product.find(query, null, sort, callback)
}

module.exports.getProductByTitle = function(query, sort, callback) {
    Product.find(query, null, sort, callback)
}
module.exports.UpdateProduct = function(product_Id, ProductData, callback) {
    Product.findOneAndUpdate({...product_Id}, { $set:{...ProductData}}, callback)
}

module.exports.filterProductByDepartment = function(department, callback) {
    let regexp = new RegExp(`${department}`, 'i')
    var query = { department: { $regex: regexp } };
    Product.find(query, callback)
}

module.exports.filterProductByCategory = function(category, callback) {
    let regexp = new RegExp(`${category}`, 'i')
    var query = { category: { $regex: regexp } };
    Product.find(query, callback);

    module.exports.UpdateProductPic = function(userId, ImagePath, callback) {
        var query = { _id: userId };
        User.findOneAndUpdate({...query }, { $set: { ImagePath: ImagePath } }, callback)
    }
}

module.exports.filterProductByTitle = function(title, callback) {
    let regexp = new RegExp(`${title}`, 'i')
    var query = { title: { $regex: regexp } };
    Product.find(query, callback);
}

module.exports.getProductByID = function(id, callback) {
    Product.findById(id, callback);
}