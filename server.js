import express from "express";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";  

const app = express();

dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.listen(PORT, () => { 
  console.log(`Server is running on PORT: http://localhost:${PORT}`);
})