const express = require("express");
const router = express.Router();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/* ADD */
router.post("/add", async (req, res) => {
  const { title, content, mood } = req.body;

  await pool.query(
    "INSERT INTO journals (title, content, mood) VALUES ($1,$2,$3)",
    [title, content, mood],
  );

  res.redirect("/journals");
});

/* GET ALL */
router.get("/all", async (req, res) => {
  const result = await pool.query("SELECT * FROM journals");
  res.json(result.rows);
});

/* DELETE */
router.delete("/delete/:id", async (req, res) => {
  await pool.query("DELETE FROM journals WHERE id=$1", [req.params.id]);
  res.send("Deleted");
});

module.exports = router;
