import jwt from "jsonwebtoken";
import "dotenv/config";


const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in .env");
}

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).json({ message: "No token provided" });

  const token = authHeader.split(" ")[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("JWT ERROR:", err.message);
      return res.status(403).json({ message: "Invalid token" });
    }

    // debug เวลาอยากเช็ค
    // console.log("DECODED TOKEN:", decoded);

    req.user = decoded;
    next();
  });
};
