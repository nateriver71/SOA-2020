const express = require("express");
const mysql = require("mysql");
var request = require("request");
const app = express.Router();

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "project_soa"
});

con.connect(err => {
    if (err) throw err;
});

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

module.exports = app;

