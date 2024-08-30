import mongoose from 'mongoose';
const ConnectionToDB=async ()=>{
    try{
        const connection=await mongoose.connect(process.env.DB_URL);
        if(connection){
            console.log(`The database is connected ${connection.host}`);
        }
    }
    catch(error){
        console.log(error);
        process.exit(1);
    }
}
export default connectionToDB;