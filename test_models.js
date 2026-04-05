require("dotenv").config();
fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + process.env.GOOGLE_API_KEY)
  .then(r => r.json())
  .then(d => {
      const models = d.models.map(m => m.name);
      console.log("ALL MODELS:");
      console.log(models.join("\n"));
  });
