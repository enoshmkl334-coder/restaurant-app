const db = require("./db");
const bcrypt = require("bcryptjs");

db.query("SELECT id, password FROM user", async (err, results) => {
  if (err) throw err;

  for (let user of results) {
    const password = user.password;

    // Skip if already hashed
    if (
      password.startsWith("$2a$") ||
      password.startsWith("$2b$") ||
      password.startsWith("$2y$")
    )
      continue;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Only update password, never permissions
      await new Promise((resolve, reject) => {
        db.query(
          "UPDATE user SET password = ? WHERE id = ?",
          [hashedPassword, user.id],
          (err2) => {
            if (err2) reject(err2);
            else resolve();
          }
        );
      });

      console.log(`✅ User ${user.id} password hashed`);
    } catch (error) {
      console.error(`❌ Error hashing password for user ${user.id}:`, error);
    }
  }

  console.log("✅ All users processed");
  process.exit();
});
