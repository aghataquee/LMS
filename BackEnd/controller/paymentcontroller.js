import Payment from '../model/payment.js';
import User from '../model/schema.js';
export const getRazorpayApiKey = asyncHandler(async (_req, res, _next) => {
    res.status(200).json({
      success: true,
      message: 'Razorpay API key',
      key: process.env.RAZORPAY_KEY_ID,
    });
  });
  export const buySubscription=async (req,res,next)=>{
    const {id}=req.user;
    try{
        const user=await User.findById(id);
        if(!user){
            return next(new AppError("user doesn't exist",500));
        }
        const subcription=await Payment.create({
            key:process.env.RAZORPAY_PLAN_ID,
            customer_notify:1,
            total_count:12
        })
        user.subcription.id=subcription.id;
        user.subcription.status=subscription.status;
        await user.save();
        res.status(200).json({
            success:true,
            message:"subscribed successfully",
            subscription_id:subcription.id
        })

    }
    catch(err){
        return next(new AppError(err.message,400));
    }
  }
  export const verifySubscription=async (req,res,next)=>{
    const {id}=req.user;
    const {razorpay_payment_id,razorpay_subcription_id,razorpay_signature}=req.body;

    const user=await User.findById(id);
    const subcription_id=user.subcription.id;
    const generatedSignature=crypto
    .createHmac('sha256',process.RAZORPAY_SECRET_KEY)
    .update(`${razorpay_payment_id}|${subcription_id}`)
    .digest('Hex');
    if(generatedSignature!==razorpay_signature){
        return next(new AppError("unsuccessful transaction",404));
    }
    await Payment.create({
        razorpay_payment_id,
        razorpay_subcription_id,
        razorpay_signature
    });
    user.subscription.status="active";
    await user.save();
    res.status(200).json({
        success:true,
        message:"subscription successful"
    })



  }
  export const cancelSubscription = asyncHandler(async (req, res, next) => {
    const { id } = req.user;
  
    // Finding the user
    const user = await User.findById(id);
  
    // Checking the user role
    if (user.role === 'ADMIN') {
      return next(
        new AppError('Admin does not need to cannot cancel subscription', 400)
      );
    }
  
    // Finding subscription ID from subscription
    const subscriptionId = user.subscription.id;
  
    // Creating a subscription using razorpay that we imported from the server
    try {
      const subscription = await razorpay.subscriptions.cancel(
        subscriptionId // subscription id
      );
  
      // Adding the subscription status to the user account
      user.subscription.status = subscription.status;
  
      // Saving the user object
      await user.save();
    } catch (error) {
      // Returning error if any, and this error is from razorpay so we have statusCode and message built in
      return next(new AppError(error.error.description, error.statusCode));
    }
    const payment = await Payment.findOne({
        razorpay_subscription_id: subscriptionId,
      });
    
      // Getting the time from the date of successful payment (in milliseconds)
      const timeSinceSubscribed = Date.now() - payment.createdAt;
    
      // refund period which in our case is 14 days
      const refundPeriod = 14 * 24 * 60 * 60 * 1000;
    
      // Check if refund period has expired or not
      if (refundPeriod <= timeSinceSubscribed) {
        return next(
          new AppError(
            'Refund period is over, so there will not be any refunds provided.',
            400
          )
        );
      }
    
      // If refund period is valid then refund the full amount that the user has paid
      await razorpay.payments.refund(payment.razorpay_payment_id, {
        speed: 'optimum', // This is required
      });
    
      user.subscription.id = undefined; // Remove the subscription ID from user DB
      user.subscription.status = undefined; // Change the subscription Status in user DB
    
      await user.save();
      await payment.remove();
    
      // Send the response
      res.status(200).json({
        success: true,
        message: 'Subscription canceled successfully',
      });
    });
  