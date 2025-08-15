//Changes made by AI

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSignupSchema = new Schema(
  {
    Username: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contact: String,
    password: String,
    image: String
  },
  { timestamps: true }
);

const karmikaSignupSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    contact: String,
    profileImage: String,
    workType: String,
    price: String,
    address: String,
    aadharImage: String,
    password: String
  },
  { timestamps: true }
);

const userSignupModel = mongoose.model("users", userSignupSchema);
const karmikaSignupModel = mongoose.model("karmikas", karmikaSignupSchema);

module.exports = { userSignupModel, karmikaSignupModel };

// Original code
// const mongoose = require("mongoose")
// const Schema = mongoose.Schema

// const userSignupSchema = new Schema({
//     Username:String,
//     email:String,
//     contact:String,
//     password:String,
//     image:String,
// });

// const karmikaSignupSchema = new Schema({
//         name:String,
//         email:String,
//         contact: String,
//         profileImage: String,
//         workType: String,
//         price:String, 
//         address: String,
//         aadharImage: String,
//         password: String,
// })



// const userSignupModel = mongoose.model("users",userSignupSchema);
// const karmikaSignupModel = mongoose.model("karmikas",karmikaSignupSchema);



// module.exports = {userSignupModel,karmikaSignupModel}