const mongoose = require("mongoose")

const connectDB =()=>{
mongoose.connect("mongodb+srv://Balaji:@karmika123@userauth.buw0dhc.mongodb.net/?retryWrites=true&w=majority&appName=UserAuth",
    { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch(err => console.log("MongoDB connection failed:", err));
}

module.exports = connectDB