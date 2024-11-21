const bcrypt = require("bcrypt-nodejs");
const getAdminPass = (password) => {
  const SALT_ROUND = "10";

  bcrypt.genSalt(SALT_ROUND, function (err, salt) {
    bcrypt.hash(password, salt, null, function (err, hash) {
      console.log(hash);

      // res.json({
      //   hash
      // })
    });
  });
};

const password = "pass";
getAdminPass(password);
