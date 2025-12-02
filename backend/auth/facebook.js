// backend/auth/facebook.js
import dotenv from "dotenv";
dotenv.config();   // ⭐ โหลด .env ก่อนใช้ env

import passport from "passport";
import { Strategy as FacebookStrategy } from "passport-facebook";
import User from "../models/User.js";

const FACEBOOK_APP_ID = process.env.FB_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FB_APP_SECRET;

console.log("🔍 [FACEBOOK] APP_ID =", FACEBOOK_APP_ID);

passport.use(
  new FacebookStrategy(
    {
      clientID: FACEBOOK_APP_ID,
      clientSecret: FACEBOOK_APP_SECRET,
      callbackURL: "http://localhost:4000/auth/facebook/callback",
      profileFields: ["id", "emails", "displayName", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.id}@facebook.com`;

        let user = await User.findOne({ email });
        if (!user) {
          user = await User.create({
            name: profile.displayName,
            email,
            avatar: profile.photos?.[0]?.value || "",
            role: "user",
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

export default passport;
