// const express = require('express')
// const router = express.Router()
// const multer = require("multer");
// const path = require("path")
// const {userSignupModelController,karmikaSignupModelController,LoginController,getKarmikas,getUser,protect,update,photo} = require("../Controllers/Controllers")


// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//       cb(null, 'public/images'); 
//     },
//     filename: (req, file, cb) => {
//       cb(null, file.fieldname + '_' + Date.now() + path.extname(file.originalname));
//     },       
//   });     
       
// const upload = multer({storage:storage});

// router.post("/SignupUser",upload.single('image'),userSignupModelController)
// router.post("/SignupKarmika",upload.fields([{name:"profileImage" , maxCount:1},{name:"aadharImage" , maxCount:1}]),karmikaSignupModelController)
// router.post("/login",LoginController)
// router.get("/check",protect,getUser)
// router.patch("/update",protect,update)  
// router.patch("/photo",protect,upload.single('image'),photo)

// router.get("/getKarmika",getKarmikas)
// router.get("/getUser",getUser)
           
// module.exports = router 