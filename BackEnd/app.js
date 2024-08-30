import express from 'express';
import cors from 'cors';
const app=express();
// inbuit middlewares;
app.use(express.json());
app.use(express.encoded({urlextended:true}));
// Third party will help in sharing resources with frontend;
app.use(cors({
    origin:[process.env.FRONTEND5_URL],

}))
// To parse token to the middleware;
app.use(CookieParser());
// Random click by user will give an error
// user Routes
app.use('/userroutes',Userroutes);
app.use('api/v2/courses',courseRoutes);
app.all('/*',(req,res)=>{
    res.send('OOPS Page Not Found 404');
})
