const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Pool } = require("pg");

const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* HOME */

app.get("/", (req, res) => {
  res.send(`
  <h1 style="text-align:center">🌿 MindWell</h1>

  <div style="display:flex;justify-content:center;gap:50px">

  <div>
  <h2>Register</h2>
  <form action="/api/auth/register" method="POST">
    <input name="name" placeholder="Name" required/><br><br>
    <input name="email" placeholder="Email" required/><br><br>
    <input name="password" type="password" placeholder="Password" required/><br><br>
    <button>Register</button>
  </form>
  </div>

  <div>
  <h2>Login</h2>
  <form action="/api/auth/login" method="POST">
    <input name="email" placeholder="Email" required/><br><br>
    <input name="password" type="password" placeholder="Password" required/><br><br>
    <button>Login</button>
  </form>
  </div>

  </div>
  `);
});

/* DASHBOARD */

app.get("/dashboard", (req, res) => {
  res.send(`
  <html>
  <head>
  <style>
    body{
      font-family: Arial;
      background: linear-gradient(to right,#667eea,#764ba2);
      color:white;
      text-align:center;
      padding:30px;
    }

    .card{
      background:white;
      color:black;
      padding:20px;
      border-radius:15px;
      width:300px;
      margin:auto;
      box-shadow:0 5px 15px rgba(0,0,0,0.3);
      transition:0.3s;
    }

    .card:hover{
      transform:scale(1.05);
    }

    input,textarea{
      width:90%;
      padding:8px;
      margin:5px;
      border-radius:8px;
      border:1px solid gray;
    }

    button{
      background:#6c63ff;
      color:white;
      border:none;
      padding:10px 15px;
      border-radius:10px;
      cursor:pointer;
      margin:5px;
    }

    button:hover{
      background:#574bdb;
    }
  </style>
  </head>

  <body>

  <h1>📊 Dashboard</h1>

  <div class="card">
  <h2>✨ Add Journal</h2>

  <form action="/api/journal/add" method="POST">
    <input name="title" placeholder="Title"><br>
    <textarea name="content" placeholder="Write your thoughts"></textarea><br>
    <input name="mood" type="number" min="1" max="10" placeholder="Mood"><br>
    <button>Save Entry</button>
  </form>
  </div>

  <br>

  <a href="/journals"><button>📖 View Journals</button></a>
  <a href="/analytics"><button>📊 Analytics</button></a>
  <a href="/breathing"><button>🌬️ Breathing Tool</button></a>

  </body>
  </html>
  `);
});

/* JOURNALS */

app.get("/journals", async (req, res) => {
  const result = await pool.query("SELECT * FROM journals ORDER BY id DESC");

  const emoji = (m) => m>=8?"😄":m>=5?"🙂":"😔";

  let html = `
  <html>
  <head>
  <style>
    body{
      font-family: Arial;
      background: linear-gradient(to right,#74ebd5,#9face6);
      padding:20px;
    }

    h1{text-align:center;color:white;}

    .container{
      display:flex;
      flex-wrap:wrap;
      justify-content:center;
    }

    .card{
      background:white;
      width:300px;
      margin:15px;
      padding:15px;
      border-radius:15px;
      box-shadow:0 5px 15px rgba(0,0,0,0.2);
      transition:0.3s;
    }

    .card:hover{
      transform:scale(1.08);
    }

    button{
      background:red;
      color:white;
      border:none;
      padding:8px;
      border-radius:8px;
      cursor:pointer;
    }
  </style>
  </head>

  <body>

  <h1>📖 My Journals</h1>
  <div class="container">
  `;

  result.rows.forEach(j=>{
    html+=`
    <div class="card">
      <h3>${j.title}</h3>
      <p>${j.content}</p>
      <b>Mood:</b> ${j.mood} ${emoji(j.mood)}
      <br><br>
      <button onclick="del(${j.id})">Delete</button>
    </div>
    `;
  });

  html+=`
  </div>

  <center>
    <a href="/dashboard"><button>⬅ Back</button></a>
  </center>

  <script>
    function del(id){
      fetch('/api/journal/delete/'+id,{method:'DELETE'})
      .then(()=>location.reload())
    }
  </script>

  </body>
  </html>
  `;

  res.send(html);
});

/* ANALYTICS */

app.get("/analytics",(req,res)=>{
res.send(`
<h1 style="text-align:center">📊 Mood Analytics</h1>
<canvas id="c"></canvas>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

<script>
fetch('/api/journal/all')
.then(r=>r.json())
.then(d=>{
new Chart(document.getElementById("c"),{
type:'line',
data:{
labels:d.map((_,i)=>"Entry "+(i+1)),
datasets:[{label:'Mood',data:d.map(x=>x.mood)}]
}
})
})
</script>
`);
});

/* 🌬️ BREATHING TOOL */

app.get("/breathing",(req,res)=>{
res.send(`
<html>
<head>
<style>
body{
background:#121212;
color:white;
text-align:center;
font-family:sans-serif;
}

#circle{
width:120px;
height:120px;
border-radius:50%;
background:#6c63ff;
margin:100px auto;
animation:breathe 8s infinite;
}

@keyframes breathe{
0%{transform:scale(1);}
50%{transform:scale(1.5);}
100%{transform:scale(1);}
}
</style>
</head>

<body>
<h1>🌬️ Breathing Exercise</h1>
<p>Inhale → Hold → Exhale</p>

<div id="circle"></div>

<br><br>
<a href="/dashboard"><button>⬅ Back</button></a>

</body>
</html>
`);
});

/* ROUTES */

app.use("/api/auth", require("./routes/auth"));
app.use("/api/journal", require("./routes/journal"));

app.listen(5000,"0.0.0.0",()=>console.log("Server running"));
