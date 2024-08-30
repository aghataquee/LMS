exports. registerUser=async (req,res,next)=>{
    try{
        const {fullname,email,password}=req.body;
        if(!fullname||!email||!password){
            return next(new AppError('All fields are required',404));
        }
        const userExists=await User.findOne({email});
        if(userExists){
            return next(new AppError('User already exists ',403));
        }
        const user=await User.create({
            fullname,
            email,
            password,
            avatar:{
                public_id:email,
                secure_id:url
            }
        })
        // saving the image in the cloudinary  and upadating it in the database
        if(req.file){
            try{
                const result=await cloudinary.v2.uploader.upload(req.file.path,{
                    folder:"lms",
                    height:250,
                    width:250,
                    gravity:"faces",
                    crop:"fill"
                });
                if(result){
                    user.avatar.public_id=result.public_id;
                    user.avatar.secure_id=result.secure_id;
                }
                fs.rm(`Removing file from local storage ${req.file.filename}`);
            }
            catch(err){
                return next(new AppError("file not found",400));
            }
        }
        if(!user){
            return next(new AppError('user not created plz try again',404));
        }

        await user.save();
        const token=await user.generatejwtToken();
        res.cookie('token',token,cookieoptions);
        user.password=undefined;
        res.status(200).json({
            success:true,
            message:"User created successfully",
            user
        })

    }
}
exports.loginUser=async (req,res,next){
    const {email,password}=req.body;
    if(!email||!password){
        return next(new AppError("all fields are required",400));
    }
    try{
        const user=await User.findOne({email}).select('+password');
        
        if(!user &&(user.comparePassword(password))){
            return next(new AppError("provide valid email and password"))
        }
        const token=await user.generateToken();
        res.cookie('token',token,cookieoptions);
        user.password=undefined;
        res.status(200).json({
            success:true,
            message:"user loggedin successfully",
            user
        })

    }catch(err){
        return next(new AppError(err.message,403));
    }
}
exports.logout=async (req,res,next)=>{
    res.cookie('token',null,{
        maxAge:0,
        httpOnly:true
    })
    res.status(200).json({
        success:true,
        message:"User logout successfully"
    })
}
exports.forgetPassword=async (req,res,next)=>{
    const {email}=req.body;
    if(!email){
        return next(new AppError("email is required",400));
    }
    try{
        const user=await User.find({email});
        if(!user){
            return next(new AppError("invalid email provide valid email",404));
        }
        const resetToken=await user.generatePasswordresetToken();
        await user.save;
        // generating url 
        const resetPasswordUrl=`${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
        const subject = 'Reset Password';
  const message = `You can reset your password by clicking <a href=${resetPasswordUrl} target="_blank">Reset your password</a>\nIf the above link does not work for some reason then copy paste this link in new tab ${resetPasswordUrl}.\n If you have not requested this, kindly ignore.`;

    await sendEmail(email, subject, message);

    // If email sent successfully send the success response
    res.status(200).json({
      success: true,
      message: `Reset password token has been sent to ${email} successfully`,
    });
  }
  catch (error) {
    // If some error happened we need to clear the forgotPassword* fields in our DB
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    await user.save();
    return next(new AppError("error generated",500));
  }
}
exports.resetPassword=async (req,res,next)=>{
    const { resetToken } = req.params;

  // Extracting password from req.body object
  const { password } = req.body;

  // We are again hashing the resetToken using sha256 since we have stored our resetToken in DB using the same algorithm
  const forgotPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Check if password is not there then send response saying password is required
  if (!password) {
    return next(new AppError('Password is required', 400));
  }

  console.log(forgotPasswordToken);

  // Checking if token matches in DB and if it is still valid(Not expired)
  const user = await User.findOne({
    forgotPasswordToken,
    forgotPasswordExpiry: { $gt: Date.now() }, // $gt will help us check for greater than value, with this we can check if token is valid or expired
  });

  // If not found or expired send the response
  if (!user) {
    return next(
      new AppError('Token is invalid or expired, please try again', 400)
    );
  }

  // Update the password if token is valid and not expired
  user.password = password;

  // making forgotPassword* valus undefined in the DB
  user.forgotPasswordExpiry = undefined;
  user.forgotPasswordToken = undefined;

  // Saving the updated user values
  await user.save();

  // Sending the response when everything goes good
  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });

}
exports.changePassword=async (req,res,next)=>{
    const {oldPassword,newPassword}=req.body;
    const id=req.id;
    if(!oldPassword||!newPassword){
        return next(new AppError("fields are required",404));
    }
    try{
        const user=await User.findById(id).select('+password');
        if(!user){
            return next(new AppError("user doesn't exist",503));
        }
        const isPasswordValid=await User.comparePassword(oldPassword);
        if(!isPasswordValid){
            return next(new AppError("password mismatches "),403);
        }
        user.Password=newPassword;
        await user.save();
        user.Password=undefined;
        res.status(200).json({
            success:true,
            message:"password changed successfully"
        })
    }catch(error){
        return next(new AppError(error,404));
    }

}
exports.updateUser=async (req,res,next)=>{
    const {fullname}=req.body;
    const {id}=req.params;
    try{
        const user=await User.findById(id);
        if(!user){
            return next(new AppError("User doesn't exist"),404);
        }
        if(fullname){
            user.fullname=fullname;
        }
        if(req.file){
            await cloudinary.v2.uploader.destroy(req.public_id);
            const result=cloudinary.v2.uploader.upload(req.file.path,{
                folder:"lms",
                height:250,
                width:250,
                gravity:"faces",
                crop:"fill"
            });
            if(result){
                user.avatar.public_id=result.public_id;
                user.avatar.secure_id=result.secure_id;
                fs.rm(`deleting from localstorage${req.file.filename}`)
            }
            
        }
        await user.save();
        res.status(200).json({
            success:true,
            message:"user updated successfully"
        })

    } catch(err){
        return next(new AppError("not updated plz try again"),404);
    }

}