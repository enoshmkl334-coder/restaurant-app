const db = require("./db");
const bcrypt = require("bcryptjs");

// New password for ALL users
const NEW_PASSWORD = "password123";

bcrypt.hash(NEW_PASSWORD, 10, (err, hashedPassword) => {
  if (err) {
    console.error("Error hashing:", err);
    process.exit(1);
  }

  // Update only the password column
  const sql = "UPDATE user SET password = ?";

  db.query(sql, [hashedPassword], (err2, result) => {
    if (err2) {
      console.error("Error updating passwords:", err2);
    } else {
      console.log(`✅ All passwords reset to: ${NEW_PASSWORD}`);
      console.log(`${result.affectedRows} users updated`);
    }
    process.exit();
  });
});
