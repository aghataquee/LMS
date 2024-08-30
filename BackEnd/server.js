import app from './app.js';
import DB_Connection from './config/db.js'
const PORT=process.env.PORT||5000;
app.listen(PORT,async ()=>{
    await DB_Connection();
    console.log(`The app is running at port ${PORT}`);
})
