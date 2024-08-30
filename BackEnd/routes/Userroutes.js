import {Router} from 'express';
import{registerUser,loginUser,logout,forgetPassword,resetPassword,changePassword,updateUser} from '../controller/usercontroller.js'
const router=Router();
router.post('/register',registerUser);
router.post('/login',loginUser);
router.get('/logout',logout);
router.post('/forgetpass',forgetPassword);
router.post('/reset',resetPassword);
router.post('/changepassword',changePassword);
router.post('/updateuser',isLoggedin,updateUser);