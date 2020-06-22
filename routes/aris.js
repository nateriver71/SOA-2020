const express = require("express");
const { Pool , Client } = require("pg");
const midtransClient = require('midtrans-client');
var request = require("request");
var multer = require("multer");
var path = require('path');
const app = express.Router();

app.use(express.urlencoded({extended:true}));

const pool = new Pool({
    host:"ec2-34-202-88-122.compute-1.amazonaws.com",
    database:"d5vc5jk8caet1t",
    user:"npvvwqlheuzuub",
    password:"f3d3b5049fadc5cf04c59a30502399e2b28c3e2affb9533b129ec150fb6a165a",
    port:"5432",
    ssl: {rejectUnauthorized:false}
})

pool.connect(err => {
    if (err) throw err;
});

const DIR = './uploads';
let storage = multer.diskStorage({
    destination: (req,file,callback) => {
        callback(null,DIR);
    },
    filename: (req,file,cb) =>{
        cb(null,file.fieldname + '-' + Date.now() + '-' + path.extname(file.originalname));
    }
});

let uploads = multer({storage: storage});

app.post("/registerUser",function(req,res){
    var email_user = req.body.email_user;
    var username_user=req.body.username_user;
    var password_user=req.body.password_user;
    var api_key = Math.random().toString().slice(2,11);
    if(email_user==""||email_user==undefined||username_user==""||username_user==undefined||password_user==""){
        return res.send("Ada Field Kosong")
    }else{
        try {
            pool.query(
                `insert into users(email_user,username_user,password_user,key_user,profil_picture,api_hit)values('${email_user}','${username_user}','${password_user}','${api_key}','1','15')`,
                (err, result) => {
                return res.send("register Berhasil");
                }
              );
             
        } catch (error) {
            res.send(error);
        }
    }    
})

app.post("/loginUser",function(req,res){
    let email_user = req.body.email_user;
    let password_user = req.body.password_user;
    if(email_user=="admin" && password_user=="admin"){
        res.send({status:200,message:"Login Sebagai ADMIN key anda 000000000"});
    }
    else{
        try {
            pool.query(`select * from users where email_user='${email_user}' and password_user ='${password_user}'`),
            (err,result) =>{
                if(result.rows == 0) return res.send({status:400,message:"Email Atau Password Salah"});
                return res.send({status:200,message:result.rows[0].key_user});
            }
        } catch (error) {
            res.send(error);
        }
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

app.post("/editImageProfile",uploads.single('gambar_profile'),async function(req,res){
    let api_key = req.body.api_key;
    let imageprofile = req.file.filename;
    let query = `select * from users where key_user='${api_key}'`;
    let conn = await getConnection();
    const login = await executeQuery(conn,query);
    if(login.length == 0) return res.status(400).send({status:400,message:"Wrong email or Pass"});
    query = `update users set profil_picture='${imageprofile}'`;
    const ganti = await executeQuery(conn,query);
    if(ganti.affectedrows == 0) return res.status(400).send({status:400,message:"Couldn't change profile picture"});
    return res.status(200).send({status:200,message:"Success change profile picture"});
    
});
/*
app.post("/topup", async function(req,res){
    let key_user = req.body.key_user;
    let query = `select * from user where key_user='${key_user}'`;
    let conn = await getConnection();
    const user = await executeQuery(conn,query);
    if(user.length == 0) return res.status(400).send({status:400,message:"Email Atau Password Salah"});
    let api_hit = user[0].api_hit + 10;
    query = `update user set api_hit=${api_hit}`;
    const apihit = await executeQuery(conn,query);
    if(apihit.affectedrows == 0) return res.status(400).send({status:400,message:"Topup Gagal"});
    return res.status(200).send({status:200,message:"Topup Berhasil Dilakukan"});

})
*/
app.post("/deleteUser", async function(req,res){
    let api_key = req.body.api_key;
    let email_user = req.body.email_user;
    let query = `delete from users where key_user = '${api_key}' and email_user = '${email_user}'`;
    let conn = await getConnection();
    const del = await executeQuery(conn,query);
    if(del.affectedrows == 0) res.status(400).send({status:400,message:"Delete user fail"});
    return res.status(200).send({status:200,message:"Success delete user"});
})

app.post("/deleteUserReview", async function(req,res){
    let email_user = req.body.email_user;
    let password_user = req.body.password_user;
    let review_id = req.body.review_id;
    let conn = await getConnection();
    let query = `select * from users where email_user = '${email_user}' and password_user = ${password_user}`;
    const login = await executeQuery(conn,query);
    if(login.length <= 0) return res.status(400).send({status:400,message:"Wrong email and password"});
    query = `delete from review where review_id = ${review_id} and email_user = '${email_user}'`;
    const del = await executeQuery(conn,query);
    if(del.affectedrows == 0) return res.status(400).send({status:400,message:"Delete review fail"});
    return res.status(200).send({status:200,message:"Success delete review"});
})

app.post("/deleteUserComment", async function(req,res){
    let email_user = req.body.email_user;
    let password_user = req.body.password_user;
    let review_id = req.body.review_id;
    let conn = await getConnection();
    let query = `select * from users where email_user = '${email_user}' and password_user = ${password_user}`;
    const login = await executeQuery(conn,query);
    if(login.length <= 0) return res.status(400).send({status:400,message:"Wrong email and password"});
    query = `delete from rcomment where review_id = ${review_id} and email_user = '${email_user}'`;
    const del = await executeQuery(conn,query);
    if(del.affectedrows == 0) return res.status(400).send({status:400,message:"Delete comment fail"});
    return res.status(200).send({status:200,message:"Success delete comment"});
})

module.exports = app;