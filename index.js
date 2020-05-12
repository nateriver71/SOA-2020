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

function getConnection(){
    return new Promise((resolve,reject)=>{
        pool.getConnection((err,conn)=>{
            if(err){
                reject(err);
            }else{
                resolve(conn);
            }
        });
        console.log("getcon");
    });
    
}
function executeQuery(conn, query){
    return new Promise((resolve,reject)=>{
        conn.query(query,(err,result)=>{
            if(err){ reject(err);}
            else {resolve(result);}
        });
        console.log("exec");
    });
}

app.post("/registerUser",async function(req,res){
    var email_user = req.body.email_user;
    var username_user=req.body.username_user;
    var password_user=req.body.password_user;
    var api_key = Math.random().toString().slice(2,11);
    if(email_user==""||username_user==""||password_user==""){
        return res.status(500).send("Ada Field Kosong")
    }else{
        let query = `insert into user values('${email_user}','${username_user}','${password_user}','${api_key}')`;
        let conn = await getConnection();
        const regis = await executeQuery(conn,query);
        if(regis.length <= 0) return res.status(400).send("Email Kembar");
        return res.status(200).send({status:200,message:"Registrasi Berhasil"});
        // pool.query("INSERT INTO USER VALUES(?,?,?)",[email_user,username_user,password_user],function(error,result){
        //     if(error ) res.status(500).send(error);
        //     else{
        //         if(result.length <=0){
        //             return res.status(400).send("Email Kembar");
        //         }
        //         res.status(200).send("sukses");
        //     }
        // });
    }    
})

app.post("/loginUser",async function(req,res){
    const email_user = req.body.email_user;
    const password_user = req.body.password_user;
    if(email_user=="admin" && password_user=="admin"){
        res.status(200).send({status:200,message:"Login Sebagai ADMIN key anda 000000000"});
    }
    else{
        let query = `select * from user where email_user='${email_user}' and password_user ='${password_user}'`;
        let conn = await getConnection();
        const user = await executeQuery(conn,query);
        if(user.length == 0) return res.status(400).send({status:400,message:"Email Atau Password Salah"});
        return res.status(200).send({status:200,message:user[0].key_user})
        // pool.getConnection(function(err,conn){
        //     if(err) res.status(500).send(err);
        //     else{
        //         conn.query(`select * from user where email_user='${email_user}' and password_user ='${password_user}'`,function(error,result){
        //             if(error ) res.status(500).send(error);
        //             else{
        //                 if(result.length <=0){
        //                     return res.status(400).send("Invalid Username or password");
        //                 }
        //                 res.status(200).send("Login Sebagai User");
        //             }
        //         })
        //     }
        // });
    }
})

app.listen(3000,function(){
    console.log("Listening to port 3000");
})
