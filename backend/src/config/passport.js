import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import userModel from "../models/user.model.js";
import partnerModel from "../models/partner.model.js";
import config from "./config.js";

// ── GOOGLE STRATEGY FOR USERS ────────────────────────────────
passport.use(
  "google-user",
  new GoogleStrategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL_USER,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar = profile.photos[0].value;

        // check if user exists by googleId
        let user = await userModel.findOne({ googleId: profile.id });

        if (!user) {
          // check if account exists by email — link google to it
          user = await userModel.findOne({ email });

          if (user) {
            // existing email account — link googleId
            user.googleId = profile.id;
            user.avatar = avatar;
            await user.save();
          } else {
            // brand new user — create account
            // isVerified: true because google already verified the email
            user = await userModel.create({
              name: profile.displayName,
              email,
              avatar,
              googleId: profile.id,
              password: null,
              isVerified: true,
            });
          }
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// ── GOOGLE STRATEGY FOR PARTNERS ─────────────────────────────
passport.use(
  "google-partner",
  new GoogleStrategy(
    {
      clientID: config.CLIENT_ID,
      clientSecret: config.CLIENT_SECRET,
      callbackURL: config.GOOGLE_CALLBACK_URL_PARTNER,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const avatar = profile.photos[0].value;

        let partner = await partnerModel.findOne({ googleId: profile.id });

        if (!partner) {
          partner = await partnerModel.findOne({ email });

          if (partner) {
            partner.googleId = profile.id;
            partner.avatar = avatar;
            await partner.save();
          } else {
            partner = await partnerModel.create({
              name: profile.displayName,
              email,
              avatar,
              googleId: profile.id,
              password: null,
              isVerified: true,
            });
          }
        }

        return done(null, partner);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

export default passport;
