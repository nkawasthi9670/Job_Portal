import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "User not authenticated",
                success: false,
            });
        }

        // Log the token to verify it's being received correctly
       
        const decode = jwt.verify(token, process.env.SECRET_KEY);
        
        
        // Log decoded token to see if verification worked
        console.log("Decoded Token:", decode);

        req.id = decode.userId;
        next();
    } catch (error) {
        // Log detailed error message
        console.error("JWT Verification Error:", error.message);
        return res.status(401).json({
            message: "Invalid or expired token",
            success: false,
        });
    }
};

export default isAuthenticated;
