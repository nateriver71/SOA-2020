const express = require("express");
const cors = require('cors');
const app = express();
const raka = require("./routes/raka");
const aris = require("./routes/aris");

app.use(express.urlencoded({extended:true}));
app.use(express.json());

app.use(cors());
app.use("/api",raka);
app.use("/api",aris);

app.listen(process.env.PORT || 5000,function(){
    console.log("Listening to port " + process.env.PORT);
})
