const express = require("express");
const mysql = require("mysql");
var request = require("request");
const app = express();

app.use(express.urlencoded({extended:true}));

const pool = mysql.createPool({
    host:"localhost",
    database:"project_soa",
    user:"root",
    password:""
})

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "project_soa"
});

con.connect(err => {
    if (err) throw err;
});

app.use(express.urlencoded({extended:true}));
app.use(express.json());

function getConnection(){
    return new Promise((resolve,reject)=>{
        pool.getConnection((err,conn)=>{
            if(err){
                reject(err);
            }else{
                resolve(conn);
            }
        });
    });
    
}
function executeQuery(conn, query){
    return new Promise((resolve,reject)=>{
        conn.query(query,(err,result)=>{
            if(err){ reject(err);}
            else {resolve(result);}
        });
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
        let query = `insert into user values('${email_user}','${username_user}','${password_user}','${api_key}',15)`;
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

//add User review
app.post("/addUserReview", async function(req,res){
    const review = req.body.review;
    const anime_id = req.body.anime_id;
    const email_user = req.body.email_user;
    const api_key = req.body.api_key;

    con.query(`select * from user where email_user=? and key_user =?`,[email_user,api_key],function(err,rows,fields){
        if(rows.length == 0) return res.status(403).send({status:403,message:"Error 403 : Forbidden, only member can add review"});
        else{
            if(rows[0].api_hit <=0 ) return res.status(400).send({status:400,message:"Your api_hit empty please recharge first"});
            let api_hit = rows[0].api_hit - 1;
            con.query(`update user set api_hit=${api_hit}`,function(err,rows,fields){
                if(err){
                    console.error(err);
                }
            })
            con.query("select * from review",function(err,rows,fields){
                if (err) {
                    console.error(err);
                } else {
                    var review_id = rows.length;    
                    con.query(`insert into review values(?,?,?,?,'0','1')`,[review_id,email_user,anime_id,review],function(err,rows,fields){
                        if (err) {
                            console.error(err);
                        } else {
                            res.status(200).send({status:200,message:"Status OK"});      
                        }
                    });  
                }
            });
        }
    });
});

//add Review Comment
app.post("/addReviewComment",async function(req,res){
    const review_id = req.body.review_id;
    const email_user = req.body.email_user;
    const comment = req.body.comment;
    const api_key = req.body.api_key;

    con.query(`select * from user where email_user=? and key_user =?`,[email_user,api_key],function(err,rows,fields){
        if(rows.length == 0) return res.status(403).send({status:403,message:"Error 403 : Forbidden, only member can add comments"});
        else{
            if(rows[0].api_hit <=0 ) return res.status(400).send({status:400,message:"Your api_hit empty please recharge first"});
            let api_hit = rows[0].api_hit - 1;
            con.query(`update user set api_hit=${api_hit}`,function(err,rows,fields){
                if(err){
                    console.error(err);
                }
            })
            con.query(`insert into rcomment values(?,?,?,'1')`,[review_id,email_user,comment],function(err,rows,fields){
                if (err) {
                    console.error(err);
                } else {
                    res.status(200).send({status:200,message:"Status OK"});      
                }
            });
        }
    });
});

//Edit User Review
app.put("/editReview",async function(req,res){
    const editreview = req.body.review;
    const email_user = req.body.email_user;
    const review_id  = req.body.review_id;
    const api_key = req.body.api_key;

    con.query(`select * from user where email_user=? and key_user =?`,[email_user,api_key],function(err,rows,fields){
        if(rows.length == 0) return res.status(403).send({status:403,message:"Error 403 : Forbidden, only member can edit review"});
        else{
            con.query("update review set review = ? where review_id=?",[editreview,review_id],function(err,rows,fields){
                if (err) {
                    console.error(err);
                } else {
                    res.status(200).send({status:200,message:"Status OK"});      
                }
            });  
        }
    });
});

//Get User Review
app.get("/getReview", async function(req,res){
    const anime_id = req.body.anime_id;

    con.query("select * from review where anime_id = ? and status = 1",[anime_id],function(err,rows,fields){
        if(rows.length == 0){
            return res.status(404).send({status:404,message:"No review found"});
        } else{
            return res.status(404).send(rows);
        }
    });
});

function getAnime(){
    return new Promise(function(resolve,reject){
        var rng = {
            'method':'GET',
            'url':'https://kitsu.io/api/edge/anime'
        };
        request(rng,function(error,response){
            if(error){
                reject(new Error(error));
            }else{
                resolve(response.body);
            }
        });
    });
}

function getCategories(){
    return new Promise(function(resolve,reject){
        var rng = {
            'method':'GET',
            'url':'https://kitsu.io/api/edge/categories'
        };
        request(rng,function(error,response){
            if(error){
                reject(new Error(error));
            }else{
                resolve(response.body);
            }
        });
    });
}

//getAnime
app.get("/getAnime", async function(req,res){
    try {
        const rando = JSON.parse(await getAnime());
        res.send(rando.data);
    } catch (error) {
        res.send(error);
    }
});

//getCategories
app.get("/getCategories", async function(req,res){
    try {
        const rando = JSON.parse(await getCategories());
        res.send(rando.data);
    } catch (error) {
        res.send(error);
    }
});

app.post("/searchAnime", async function(req,res){
    let nama = req.body.anime;
    let email_user = req.body.email_user;
    let api_key = req.body.api_key;
    try {
        const rando = JSON.parse(await getAnime());
        var animelist = [];
        for (var i=0;i<10;i++){
            if(rando.data[i].attributes.canonicalTitle.includes(nama)){
                animelist.push(rando.data[i].attributes.canonicalTitle);
            }
            
        }
        res.send(animelist);
    } catch(error){
        res.send(error);
    }
    
})

app.post("/deleteUser", async function(req,res){
    let api_key = req.body.api_key;
    let email_user = req.body.email_user;
    let query = `delete from user where key_user = '${api_key}' and email_user = '${email_user}'`;
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
    let query = `select * from user where email_user='${email_user}' and password_user='${password_user}'`;
    const login = await executeQuery(conn,query);
    if(login.length == 0) return res.status(400).send({status:400,message:"Wrong email and password"});
    query = `delete from review where review_id = '${review_id}' and email_user'${email_user}'`;
    const del = await executeQuery(conn,query);
    if(del.affectedrows == 0) res.status(400).send({status:400,message:"Delete review fail"});
    return res.status(200).send({status:200,message:"Success delete review"});
})

app.post("/deleteUserComment", async function(req,res){
    let email_user = req.body.email_user;
    let password_user = req.body.password_user;
    let review_id = req.body.review_id;
    let conn = await getConnection();
    let query = `select * from user where email_user = '${email_user}' and password_user = ${password_user}`;
    const login = await executeQuery(conn,query);
    if(login.length <= 0) return res.status(400).send({status:400,message:"Wrong email and password"});
    query = `delete from rcomment where review_id = ${review_id} and email_user = '${email_user}'`;
    const del = await executeQuery(conn,query);
    if(del.affectedrows == 0) return res.status(400).send({status:400,message:"Delete comment fail"});
    return res.status(200).send({status:200,message:"Success delete comment"});
})

app.listen(3000,function(){
    console.log("Listening to port 3000");
})
