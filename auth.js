const GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

require("dotenv").config();
module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user);
  });
  passport.deserializeUser((user, done) => {
    done(null, user);
  });

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/googleauth/callback",
        // callbackURL: "https://yasn.now.sh",
      },

      (token, refreshToken, profile, done) => {
        let emailDomain = profile.emails[0].value.split("@");
        if (emailDomain[1] !== "daiict.ac.in") {
          return done(null, false, {
            message: "log in allowed for @daiict.ac.in emails only",
          });
          //    done(new Error("Invalid host domain"));
        }
        // console.log(JSON.stringify(profile));
        return done(null, {
          profile: profile,
          token: token,
        });
      }
    )
  );
};
