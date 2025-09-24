import express from 'express'
import authRoutes from './routes/auth.route.js'
import listingRoutes from './routes/listing.route.js'
import rentalRoutes from './routes/rental.route.js'
import inventoryRoutes from './routes/inventory.route.js'
import deliveryRoutes from './routes/delivery.route.js'
import orderRoutes from './routes/order.route.js'
import cartRoutes from './routes/cart.route.js'
import emailVerificationRoutes from './routes/emailVerification.route.js'
import dotenv from 'dotenv'
dotenv.config()
import { connectDB } from './lib/db.js'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express();
app.use(express.json({ limit: '10mb' })); // allow base64 image payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  process.env.CLIENT_URL_ALT || "http://localhost:5174",
];

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/email-verification", emailVerificationRoutes);



app.listen(process.env.PORT, () => {
  console.log('Server is running on port ' + process.env.PORT);
  connectDB();
})