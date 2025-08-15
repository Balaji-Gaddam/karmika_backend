//Changes made by AI

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const connectDB = require('./DB/Db');
const path = require('path');

const authRoutes = require('./Routes/authRoutes');
const userRoutes = require('./Routes/userRoutes');
const karmikaRoutes = require('./Routes/karmikaRoutes');

const app = express();

// Connect to DB
connectDB();

// Middlewares
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan('dev'));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200,
});
app.use(limiter);

// Routes (prefixed with /api)
app.use('/api', authRoutes);
app.use('/api', userRoutes);
app.use('/api', karmikaRoutes);

// health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});











// const express= require("express")
// const cors = require("cors")
// const connectDB = require("./DB/Db")
// const router = require("./Routes/Routes")
// const PORT = 5000


// const app = express()
// const bodyParser = require('body-parser');

// app.use(cors({credentials:true, origin:"http://localhost:3000"}));
// app.use(express.json())
// app.use(express.urlencoded({ extended: true }));

// app.use(express.static('public'));
// connectDB()

// app.use("/",router)

// app.listen(PORT,()=>{
//     console.log("Port running at 5000")
// })
