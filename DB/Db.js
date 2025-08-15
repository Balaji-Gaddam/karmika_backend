const mongoose = require("mongoose")

const connectDB =()=>{
    mongoose.connect(process.env.MONGODB_URI)
        .then(() => console.log("✅ Connected to MongoDB successfully"))
        .catch(err => console.error("❌ MongoDB connection failed:", err));
}

module.exports = connectDB