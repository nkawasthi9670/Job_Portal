import dotenv from "dotenv";
dotenv.config({});


import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";
import path from 'path';




const app = express();

const _dirname = path.resolve();

// middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
const corsOptions = {
    origin:'https://job-portal-ha36.onrender.com',
    credentials:true
}

app.use(cors(corsOptions));

const PORT = process.env.PORT || 3000;


// api's
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

app.use(express.static(path.join(_dirname, "/frontend/dist")))
app.use('*', (req, res) => {
    res.sendFile(path.resolve(_dirname, "frontend", "dist", "index.html"))
})



connectDB();
app.listen(PORT,()=>{
    console.log(`Server running at port ${PORT}`);
})