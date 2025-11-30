// src/utils/generateToken.js
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const payload = {
    id: user._id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export default generateToken;
