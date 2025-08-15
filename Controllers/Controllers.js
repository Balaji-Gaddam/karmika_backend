//Changes made by AI


const { userSignupModel, karmikaSignupModel } = require("../Models/Models");
const bcryptJs = require("bcryptjs");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;
const { isGmailAddress, isValidIndianMobile } = require("../utils/validation");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d'; // 1 day

if (!JWT_SECRET) {
  console.error('JWT_SECRET not set in env');
  process.exit(1);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const signToken = id => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

const uploadBufferToCloudinary = (buffer, folder = '') => {
  return new Promise((resolve, reject) => {
    const upload_stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    streamifier.createReadStream(buffer).pipe(upload_stream);
  });
};

const userSignupModelController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: "No file uploaded" });
    }

    const { Username, email, password, contact } = req.body;

    // Email validation
    if (!isGmailAddress(email)) {
      return res.status(400).json({ status: 'fail', message: 'Email must be a Gmail account.' });
    }

    // Phone validation
    if (!isValidIndianMobile(contact)) {
      return res.status(400).json({ status: 'fail', message: 'Mobile number must be a valid Indian number.' });
    }

    const existingUser = await userSignupModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: "User already existed" });
    }

    const hashPassword = bcryptJs.hashSync(password);
    const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'karmika/profiles');

    const newUser = new userSignupModel({
      Username,
      email,
      password: hashPassword,
      contact,
      image: uploaded.secure_url
    });

    await newUser.save();
    const token = signToken(newUser._id);
    return res.status(201).json({ status: 'success', message: "user signup successfully", token, user: newUser });
  } catch (error) {
    console.error("Error during signup", error);
    return res.status(500).json({ status: 'error', message: "Internal server Error", error: error.message });
  }
};

const karmikaSignupModelController = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ status: 'fail', message: "No files uploaded" });
    }

    const { name, email, contact, workType, price, address, password } = req.body;

    // Email validation
    if (!isGmailAddress(email)) {
      return res.status(400).json({ status: 'fail', message: 'Email must be a Gmail account.' });
    }

    // Phone validation
    if (!isValidIndianMobile(contact)) {
      return res.status(400).json({ status: 'fail', message: 'Mobile number must be a valid Indian number.' });
    }

    const profileFile = req.files['profileImage']?.[0];
    const aadharFile = req.files['aadharImage']?.[0];

    if (!profileFile || !aadharFile) {
      return res.status(400).json({ status: 'fail', message: "Profile and Aadhar images are required" });
    }

    const existingUser = await karmikaSignupModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ status: 'fail', message: "Sorry user already existed" });
    }

    const hashPassword = bcryptJs.hashSync(password);

    const uploadedProfile = await uploadBufferToCloudinary(profileFile.buffer, 'karmika/profiles');
    const uploadedAadhar = await uploadBufferToCloudinary(aadharFile.buffer, 'karmika/aadhar');

    const newKarmika = new karmikaSignupModel({
      name,
      email,
      contact,
      profileImage: uploadedProfile.secure_url,
      workType,
      price,
      address,
      aadharImage: uploadedAadhar.secure_url,
      password: hashPassword
    });

    await newKarmika.save();
    return res.status(201).json({ status: 'success', message: "Karmika signed up successfully", user: newKarmika });
  } catch (error) {
    console.error("Error during Karmika signup:", error);
    return res.status(500).json({ status: 'error', message: "Internal server error", error: error.message });
  }
};

const LoginController = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await userSignupModel.findOne({ email: email });
    const existingKarmika = await karmikaSignupModel.findOne({ email: email });

    if (existingUser || existingKarmika) {
      const userPassword = existingUser ? existingUser.password : existingKarmika.password;
      const isPasswordCorrect = bcryptJs.compareSync(password, userPassword);

      if (!isPasswordCorrect) {
        return res.status(400).json({ status: 'fail', message: 'Invalid credentials' });
      }

      const user = existingUser ? existingUser : existingKarmika;
      const token = signToken(user._id);

      const safeUser = { ...user.toObject() };
      delete safeUser.password;

      return res.status(200).json({ status: "success", message: "User logged in successfully", token, user: safeUser });
    } else {
      return res.status(400).json({ status: 'fail', message: "User not found" });
    }
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ status: 'error', message: "Error during login", error: error.message });
  }
};

const getKarmikas = async (req, res) => {
  try {
    const Karmikas = await karmikaSignupModel.find();
    return res.status(200).json({ status: 'success', data: Karmikas });
  } catch (error) {
    console.error("error fetching Karmikas", error);
    res.status(500).json({ status: 'error', message: error.message });
  }
};

const getUser = async (req, res) => {
  try {
    const currentUser = req.user;
    const safeUser = { ...currentUser.toObject() };
    delete safeUser.password;
    res.status(200).json({ status: "success", user: safeUser });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 'error', message: "Internal Server Error", error: error.message });
  }
};

const update = async (req, res) => {
  try {
    const id = req.user._id;
    const user = await userSignupModel.findById(id);
    const karmika = await karmikaSignupModel.findById(id);

    let updatedUser;
    if (user) {
      updatedUser = await userSignupModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
    }
    if (karmika) {
      updatedUser = await karmikaSignupModel.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true
      });
    }

    if (!updatedUser) {
      return res.status(404).json({ status: 'fail', message: 'User not found for update' });
    }

    const safeUser = { ...updatedUser.toObject() };
    delete safeUser.password;

    res.status(200).json({
      status: "success",
      user: safeUser
    });
  } catch (err) {
    console.error('update error', err);
    res.status(500).json({ status: 'error', message: 'Unable to update user', error: err.message });
  }
};

const photo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'fail', message: 'No file provided' });
    }

    const id = req.user._id;
    const user = await userSignupModel.findById(id);
    const karmika = await karmikaSignupModel.findById(id);

    const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'karmika/profiles');

    let updatedUser;
    if (user) {
      updatedUser = await userSignupModel.findByIdAndUpdate(id, { image: uploaded.secure_url }, { new: true, runValidators: true });
    } else if (karmika) {
      updatedUser = await karmikaSignupModel.findByIdAndUpdate(id, { profileImage: uploaded.secure_url }, { new: true, runValidators: true });
    }

    const safeUser = { ...updatedUser.toObject() };
    delete safeUser.password;

    res.status(200).json({
      status: "success",
      user: safeUser
    });
  } catch (err) {
    console.error('photo upload error', err);
    res.status(500).json({ status: 'error', message: 'Unable to upload photo', error: err.message });
  }
};

module.exports = {
  userSignupModelController,
  karmikaSignupModelController,
  LoginController,
  getKarmikas,
  getUser,
  protect: require('../Middleware/authMiddleware').protect,
  update,
  photo
};

// const { userSignupModel, karmikaSignupModel } = require("../Models/Models");
// const bcryptJs = require("bcryptjs");
// const { promisify } = require("util");
// const jwt = require("jsonwebtoken");
// const streamifier = require("streamifier");
// const cloudinary = require("cloudinary").v2;

// const JWT_SECRET = process.env.JWT_SECRET;
// const JWT_EXPIRES_IN = '1d'; // 1 day

// if (!JWT_SECRET) {
//   console.error('JWT_SECRET not set in env');
//   process.exit(1);
// }

// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const signToken = id => {
//   return jwt.sign({ id }, JWT_SECRET, {
//     expiresIn: JWT_EXPIRES_IN
//   });
// };

// const uploadBufferToCloudinary = (buffer, folder = '') => {
//   return new Promise((resolve, reject) => {
//     const upload_stream = cloudinary.uploader.upload_stream(
//       { folder },
//       (error, result) => {
//         if (result) resolve(result);
//         else reject(error);
//       }
//     );
//     streamifier.createReadStream(buffer).pipe(upload_stream);
//   });
// };

// const userSignupModelController = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ status: 'fail', message: "No file uploaded" });
//     }
//     const { Username, email, password, contact } = req.body;
//     const existingUser = await userSignupModel.findOne({ email: email });
//     if (existingUser) {
//       return res.status(400).json({ status: 'fail', message: "User already existed" });
//     }
//     const hashPassword = bcryptJs.hashSync(password);
//     // upload profile image buffer to cloudinary
//     const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'karmika/profiles');
//     const newUser = new userSignupModel({
//       Username,
//       email,
//       password: hashPassword,
//       contact,
//       image: uploaded.secure_url
//     });
//     await newUser.save();
//     const token = signToken(newUser._id);
//     return res.status(201).json({ status: 'success', message: "user signup successfully", token, user: newUser });
//   } catch (error) {
//     console.error("Error during signup", error);
//     return res.status(500).json({ status: 'error', message: "Internal server Error", error: error.message });
//   }
// };

// const karmikaSignupModelController = async (req, res) => {
//   try {
//     if (!req.files) {
//       return res.status(400).json({ status: 'fail', message: "No files uploaded" });
//     }

//     const { name, email, contact, workType, price, address, password } = req.body;
//     const profileFile = req.files['profileImage']?.[0];
//     const aadharFile = req.files['aadharImage']?.[0];

//     if (!profileFile || !aadharFile) {
//       return res.status(400).json({ status: 'fail', message: "Profile and Aadhar images are required" });
//     }

//     const existingUser = await karmikaSignupModel.findOne({ email: email });
//     if (existingUser) {
//       return res.status(400).json({ status: 'fail', message: "Sorry user already existed" });
//     }

//     const hashPassword = bcryptJs.hashSync(password);

//     const uploadedProfile = await uploadBufferToCloudinary(profileFile.buffer, 'karmika/profiles');
//     const uploadedAadhar = await uploadBufferToCloudinary(aadharFile.buffer, 'karmika/aadhar');

//     const newKarmika = new karmikaSignupModel({
//       name,
//       email,
//       contact,
//       profileImage: uploadedProfile.secure_url,
//       workType,
//       price,
//       address,
//       aadharImage: uploadedAadhar.secure_url,
//       password: hashPassword
//     });

//     await newKarmika.save();
//     return res.status(201).json({ status: 'success', message: "Karmika signed up successfully", user: newKarmika });
//   } catch (error) {
//     console.error("Error during Karmika signup:", error);
//     return res.status(500).json({ status: 'error', message: "Internal server error", error: error.message });
//   }
// };

// const LoginController = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const existingUser = await userSignupModel.findOne({ email: email });
//     const existingKarmika = await karmikaSignupModel.findOne({ email: email });

//     if (existingUser || existingKarmika) {
//       const userPassword = existingUser ? existingUser.password : existingKarmika.password;
//       const isPasswordCorrect = bcryptJs.compareSync(password, userPassword);

//       if (!isPasswordCorrect) {
//         return res.status(400).json({ status: 'fail', message: 'Invalid credentials' });
//       }

//       const user = existingUser ? existingUser : existingKarmika;
//       const token = signToken(user._id);

//       // Don't send password back
//       const safeUser = { ...user.toObject() };
//       delete safeUser.password;

//       return res.status(200).json({ status: "success", message: "User logged in successfully", token, user: safeUser });
//     } else {
//       return res.status(400).json({ status: 'fail', message: "User not found" });
//     }
//   } catch (error) {
//     console.error("Error during login:", error);
//     return res.status(500).json({ status: 'error', message: "Error during login", error: error.message });
//   }
// };

// const getKarmikas = async (req, res) => {
//   try {
//     const Karmikas = await karmikaSignupModel.find();
//     return res.status(200).json({ status: 'success', data: Karmikas });
//   } catch (error) {
//     console.error("error fetching Karmikas", error);
//     res.status(500).json({ status: 'error', message: error.message });
//   }
// };

// const getUser = async (req, res) => {
//   try {
//     const currentUser = req.user;
//     const safeUser = { ...currentUser.toObject() };
//     delete safeUser.password;
//     res.status(200).json({ status: "success", user: safeUser });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ status: 'error', message: "Internal Server Error", error: error.message });
//   }
// };

// const update = async (req, res) => {
//   try {
//     const id = req.user._id;
//     const user = await userSignupModel.findById(id);
//     const karmika = await karmikaSignupModel.findById(id);

//     let updatedUser;
//     if (user) {
//       updatedUser = await userSignupModel.findByIdAndUpdate(id, req.body, {
//         new: true,
//         runValidators: true
//       });
//     }
//     if (karmika) {
//       updatedUser = await karmikaSignupModel.findByIdAndUpdate(id, req.body, {
//         new: true,
//         runValidators: true
//       });
//     }

//     if (!updatedUser) {
//       return res.status(404).json({ status: 'fail', message: 'User not found for update' });
//     }

//     const safeUser = { ...updatedUser.toObject() };
//     delete safeUser.password;

//     res.status(200).json({
//       status: "success",
//       user: safeUser
//     });
//   } catch (err) {
//     console.error('update error', err);
//     res.status(500).json({ status: 'error', message: 'Unable to update user', error: err.message });
//   }
// };

// const photo = async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ status: 'fail', message: 'No file provided' });
//     }

//     const id = req.user._id;
//     const user = await userSignupModel.findById(id);
//     const karmika = await karmikaSignupModel.findById(id);

//     const uploaded = await uploadBufferToCloudinary(req.file.buffer, 'karmika/profiles');

//     let updatedUser;
//     if (user) {
//       updatedUser = await userSignupModel.findByIdAndUpdate(id, { image: uploaded.secure_url }, { new: true, runValidators: true });
//     } else if (karmika) {
//       updatedUser = await karmikaSignupModel.findByIdAndUpdate(id, { profileImage: uploaded.secure_url }, { new: true, runValidators: true });
//     }

//     const safeUser = { ...updatedUser.toObject() };
//     delete safeUser.password;

//     res.status(200).json({
//       status: "success",
//       user: safeUser
//     });
//   } catch (err) {
//     console.error('photo upload error', err);
//     res.status(500).json({ status: 'error', message: 'Unable to upload photo', error: err.message });
//   }
// };

// module.exports = {
//   userSignupModelController,
//   karmikaSignupModelController,
//   LoginController,
//   getKarmikas,
//   getUser,
//   protect: require('../Middleware/authMiddleware').protect,
//   update,
//   photo
// };










// const {userSignupModel,karmikaSignupModel} = require("../Models/Models")
// const bcryptJs = require("bcryptjs")
// const { promisify } = require('util');
// const jwt = require('jsonwebtoken');
// const secret= "secret"

// const signToken = id => {
//     return jwt.sign({ id }, secret, {
//       expiresIn: '2d'
//     });
//   };


// const userSignupModelController = async(req,res)=>{
//     try {
//         if(!req.file){
//             return res.status(400).json({message:"No file Uploded"})
//         }
//         const {Username,email,password,contact} = req.body;
//         const existingUser = await userSignupModel.findOne({email:email})
//         if(existingUser){
//             res.status(400).json({message:"user already existed"})
//         }
//         const hashPassword = bcryptJs.hashSync(password)
//         const newUser = new userSignupModel({
//             Username,
//             email,
//             password:hashPassword,
//             contact,
//             image: req.file.filename,
//         })
//         await newUser.save();
//         const token =signToken(newUser._id)
//         return res.status(200).json({message:"user signup succesfully",token})
        
//     } catch (error) {
//         console.error("Error during signup",error)
//         return res.status(500).json({message:"Internal server Error",error:error})
//     }
// } 




// const karmikaSignupModelController = async (req, res) => {
//     try {
//         if (!req.files || Object.keys(req.files).length === 0) {
//             return res.status(400).json({ message: "No files uploaded" });
//         }

//         const { name,email,contact, workType,price, address, password } = req.body;
//         const profileImage = req.files['profileImage'][0].filename; // Accessing profile image filename
//         const aadharImage = req.files['aadharImage'][0].filename; // Accessing Aadhar image filename
//         const existingUser = await karmikaSignupModel.findOne({email:email})
//         if(existingUser){
//             res.status(400).json({message:"sorry user already existed"})
//         }
//         const hashPassword = bcryptJs.hashSync(password)
//         const newKarmika = new karmikaSignupModel({
//             name,
//             email,
//             contact,
//             profileImage,
//             workType,
//             price,
//             address,  
//             aadharImage,
//             password:hashPassword
//         });

//         await newKarmika.save();

//         return res.status(200).json({ message: "Karmika signed up successfully" });
//     } catch (error) {
//         console.error("Error during Karmika signup:", error);
//         return res.status(500).json({ message: "Internal server error", error: error });
//     }
// };


// const LoginController = async (req, res) => {
//     const { email, password } = req.body;

//     try {
//         console.log("Searching for user with email:", email);

//         const existingUser = await userSignupModel.findOne({ email: email });
//         const existingKarmika = await karmikaSignupModel.findOne({ email: email });

//         if (existingUser || existingKarmika) {
//             const userPassword = existingUser ? existingUser.password : existingKarmika.password;
//             const isPasswordCorrect = bcryptJs.compareSync(password, userPassword);

//             if (!isPasswordCorrect) {
//                 return res.status(400).json({ message: 'Invalid credentials' });
//             }

           
//             const user= existingUser? existingUser: existingKarmika
           
//             const token= signToken(user._id)
//             console.log(token)
//             console.log(user)
           

//             return res.status(200).json({status: "success", message: "User logged in successfully",token,user });
//         } else {
//             return res.status(400).json({ message: "User not found" });
//         }
//     } catch (error) {
//         console.error("Error during login:", error);
//         return res.status(500).json({ message: "Error during login", error });
//     }
// };


// const getKarmikas=async(req,res)=>{
//     try {
//         const Karmikas = await karmikaSignupModel.find();
//         return res.status(200).json(Karmikas)
//     } catch (error) {
//         console.error("error fetching Karmikas",error)
//         res.status(400).json({message:error})
//     }
// }


// const getUser = async (req, res) => {
//     try {
//         const userId = req.user.id;

//         const existingUser = await userSignupModel.findById( userId);
//         const existingKarmika = await karmikaSignupModel.findById(userId);
      
//         // 3) Check if user still exists
//         const currentUser = existingUser ? existingUser: existingKarmika
//         // Fetch user and karmika details concurrently
//         res.status(200).json({status: "success",user: currentUser})
//     } catch (error) {
//         console.error(error);
//         return res.status(500).json({ message: "Internal Server Error" });
//     }
// };

// const protect = async (req, res, next) => {
//     // 1) Getting token and check of it's there
//     let token;
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith('Bearer')
//     ) {
//       token = req.headers.authorization.split(' ')[1];
//     } 
  
//     if (!token) {
//         console.log("token not provided")
//       return res.status(500).json({message:" token not provided"})
//     }
//     console.log(token)
//     // 2) Verification token
//     let decoded
//     try{
//      decoded = await promisify(jwt.verify)(token, secret);
//     }
//     catch(e){
//         return res.status(400).json({message: "jwt malformed"})
//     }

   

//     const existingUser = await userSignupModel.findById( decoded.id);
//     const existingKarmika = await karmikaSignupModel.findById(decoded.id);
  
//     // 3) Check if user still exists
//     const currentUser = existingUser ? existingUser: existingKarmika
//     if (!currentUser) {
//       return res.status(404).json({message: "user not valid"})












//     }
  
//     // 4) Check if user changed password after the token was issued
    
  
//     //GRANT ACCESS TO PROTECTED ROUTE
//     req.user = currentUser;
//     res.locals.user = currentUser;
//     // res.status(400).json({message: "successful"})
//     next()
//   };

//   const update= async(req,res)=>{

//     const id= req.user._id
//     console.log(req.body)

//     const user= await userSignupModel.findById(id)
//     const karmika = await karmikaSignupModel.findById(id)

//     let updatedUser
//     if(user){
//         updatedUser= await userSignupModel.findByIdAndUpdate(id,req.body,{
//             new: true,
//             runValidators: true
//         })
//     }
//     if(karmika){
//         updatedUser= await karmikaSignupModel.findByIdAndUpdate(id,req.body,{
//             new: true,
//             runValidators: true
//         })

//     }

//     console.log(updatedUser)

//     res.status(200).json({
//         status: "success",
//         user: updatedUser
//     })
//   }

// const photo= async(req,res)=>{
//     const id= req.user._id
//     console.log(req.file)
    

//     const user= await userSignupModel.findById(id)
//     const karmika = await karmikaSignupModel.findById(id)

//     let updatedUser
//     if(user){
//         const body= {image: req.file.filename}
//         updatedUser= await userSignupModel.findByIdAndUpdate(id,body,{
//             new: true,
//             runValidators: true
//         })
//     }
//     if(karmika){
//         const body= {profileImage: req.file.filename}
//         updatedUser= await karmikaSignupModel.findByIdAndUpdate(id,body,{
//             new: true,
//             runValidators: true
//         })

//     }

//     console.log(updatedUser)

//     res.status(200).json({
//         status: "success",
//         user: updatedUser
//     })
    
// }

// module.exports = {userSignupModelController,karmikaSignupModelController,LoginController,getKarmikas,getUser,protect,update,photo}