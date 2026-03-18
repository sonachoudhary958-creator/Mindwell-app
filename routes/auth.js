const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");

/* REGISTER */

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users(name,email,password) VALUES($1,$2,$3)",
      [name, email, hash],
    );

    res.send("Registration successful");
  } catch (err) {
    console.log(err);
    res.send("Registration failed");
  }
});

/* LOGIN */

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const result = await pool.query("SELECT * FROM users WHERE email=$1", [
    email,
  ]);

  if (result.rows.length === 0) return res.send("User not found");

  const user = result.rows[0];

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) return res.send("Wrong password");

  res.redirect("/dashboard");
});

module.exports = router;
