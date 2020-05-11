const express = require("express");
const mysql = require("mysql");
const app = express();

app.use(express.urlencoded({extended:true}));

const pool = mysql.createPool({
    host:"localhost",
    database:"project_soa",
    user:"root",
    password:""
})

app.post("/registerUser",(req,res)=>{
    var email_user = req.body.email_user;
    var username_user=req.body.username_user;
    var password_user=req.body.password_user;
    if(email_user==""||nama_user==""||password_user==""){
        res.status(500).send("Ada Field Kosong")
    }else{
        pool.query("INSERT INTO USER VALUES(?,?,?)",[email_user,username_user,password_user],function(error,result){
            if(error ) res.status(500).send(error);
            else{
                if(result.length <=0){
                    return res.status(400).send("Email Kembar");
                }
                res.status(200).send("sukses");
            }
        });
    }    
})

app.post("/loginUser",(req,res)=>{
    const email_user = req.body.email_user;
    const password_user = req.body.password_user;
    if(email_user=="admin" && password_user=="admin"){
        res.status(200).send("Login Sebagai ADMIN");
    }
    else{
        pool.getConnection(function(err,conn){
            if(err) res.status(500).send(err);
            else{
                conn.query(`select * from user where email_user='${email_user}' and password_user ='${password_user}'`,function(error,result){
                    if(error ) res.status(500).send(error);
                    else{
                        if(result.length <=0){
                            return res.status(400).send("Invalid Username or password");
                        }
                        res.status(200).send("Login Sebagai User");
                    }
                })
            }
        });
    }
})

app.listen(3000,function(){
    console.log("Listening to port 3000");
})
