const isloggedin=async (req,res,next)=>{
    const token=req.cookies;
    if(!token){
        return next(new AppError("token doesn't exist plz try again",404));
    }
    const decoded=await jwt.verify(token,process.env.JWT_SECRET);
    if(!decoded){
        return next(new AppError("invalid credential",404));
    }
    req.user=decoded;
    next();
}
export default isloggedin;