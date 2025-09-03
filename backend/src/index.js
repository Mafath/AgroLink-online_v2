import express from 'express'
import authRoutes from './routes/auth.route.js'
import dotenv from 'dotenv'
dotenv.config()
import { connectDB } from './lib/db.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express();
app.use(express.json()); //allows to extract json data from the request body
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true  //allow the cookies to be sent from the server to the client
}));
app.use("/api/auth", authRoutes);



app.listen(process.env.PORT, () => {
  console.log('Server is running on port ' + process.env.PORT);
  connectDB();
})