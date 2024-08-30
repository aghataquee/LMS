
import {model,Schema} from mongoose;
const userSchema=new  Schema({
    fullname:{
        type:String,
        required:[true,"Name field is required"],
        maxLength:[50,"Name should be less than 50"],
        minLength:[12,"Name should be greater than 12"],
        trim:true,
        lowercase:true
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:[true,"Email already exists"]
    },
    password:{
        type:String,
        minLength:[6,"password should be at least of 6 length"],
        select:false
    },
    avatar:{
        public_id:{
            type:String
        },
        secure_url:{
            type:String
        }
    },
    subscription:{
        id:String,
        status:String
    },
    role:{
        type:String,
        enum:["admin","user"],
        default:"user"
    },
    forgotPasswordToken:String,
    forgotPasswordExpiry:Date()


},{
    timestamps:true
});
userSchema.pre('save',async function(next){
    if(!this.isModified(password))return next();
    this.password=await bcrypt.hash(this.password,10);
});
userSchema.methods={
    comparePassword:async function(plainPassword){
        await bcrypt.compare(plainPassword,this.password);
    },
    generatejwtToken:async function(){
        return await jwt.sign({
            id:this._id,role:this.role,subscription:this.subscription
        },
        process.env.JWT_SECRET,{
            expiresIn:process.env.JWT_EXPIRY
        })

    },
    generatePasswordResetToken:async function(){
        const resetToken=crypto.randomBytes(20).toString('hex');
        this.forgotPasswordToken=crypto.hash('sha256').
        update(resetToken).
        digest('hex');
        this.forgotPasswordExpiry=Date.now()+15*60*1000
        return resetToken;
    }


}
const User=model("user",userSchema);
export default User;