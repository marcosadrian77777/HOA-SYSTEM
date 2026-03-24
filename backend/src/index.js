import dotenv from "dotenv";
import { connect } from "node:http2";
import connectDB from "./config/database.js";
import { error } from "node:console";

dotenv.config({
    path: './.env' 
});

const startServer = async () => {
    try {
        await connectDB()

        app.on("error", (error) => {
            console.log("ERROR", error);
            throw error;

        });

        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port : 
                ${process.env.PORT}`);

        })
    } catch (error) {
        console.log("MongoDB connection failed!!", error);


    }
}

startServer();