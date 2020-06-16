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

app.listen(3000,function(){
    console.log("Listening to port 3000");
})
