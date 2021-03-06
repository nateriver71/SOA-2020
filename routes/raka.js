const express = require("express");
const { Client } = require("pg");
const midtransClient = require('midtrans-client');
var request = require("request");
var multer = require("multer");
var path = require('path');
const app = express.Router();



const con = new Client({
    host:"ec2-34-202-88-122.compute-1.amazonaws.com",
    database:"d5vc5jk8caet1t",
    user:"npvvwqlheuzuub",
    password:"f3d3b5049fadc5cf04c59a30502399e2b28c3e2affb9533b129ec150fb6a165a",
    port:"5432",
    ssl: {rejectUnauthorized:false}
})

con.connect(err => {
    if (err) throw err;
});

//add User review
app.post("/addUserReview", async function(req,res){
    const review = req.body.review;
    const anime_id = req.body.anime_id;
    const email_user = req.body.email_user;
    const api_key = req.body.api_key;

    con.query(`select * from users where email_user=$1 and key_user =$2`,[email_user,api_key],function(err,result){
        if(result.rows == 0) return res.status(403).send({status:403,message:"Error 403 : Forbidden, only member can add review"});
        else{
            if(result.rows[0].api_hit <=0 ) return res.status(400).send({status:400,message:"Your api_hit empty please recharge first"});
            let api_hit = result.rows[0].api_hit - 1;
            con.query(`update users set api_hit=${api_hit}`,function(err,rows,fields){
                if(err){
                    console.error(err);
                }
            })
            con.query("select * from review",function(err,result,fields){
                if (err) {
                    console.error(err);
                } else {
                    var review_id = result.rows.length;    
                    con.query(`insert into review values($1,$2,$3,$4,'0','1')`,[review_id,email_user,anime_id,review],function(err,rows,fields){
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

    con.query(`select * from users where email_user=$1 and key_user =$2`,[email_user,api_key],function(err,result,fields){
        if(result.rows == 0) return res.status(403).send({status:403,message:"Error 403 : Forbidden, only member can add comments"});
        else{
            if(result.rows[0].api_hit <=0 ) return res.status(400).send({status:400,message:"Your api_hit empty please recharge first"});
            let api_hit = result.rows[0].api_hit - 1;
            con.query(`update users set api_hit=${api_hit}`,function(err,rows,fields){
                if(err){
                    console.error(err);
                }
            })
            con.query(`insert into rcomment values($1,$2,$3,'1')`,[review_id,email_user,comment],function(err,rows,fields){
                if (err) {
                    console.error(err);
                } else {
                    res.status(200).send({status:200,message:"Status OK"});      
                }
            });
        }
    });
});

//Topup
app.get("/topup/:key_user", async function(req,res){
	let key_user = req.params.key_user;
	con.query("select * from users where key_user= $1",[key_user],function(err,result,fields){
		if(result.rows == 0) {
			return res.status(400).send({
				status:400,
				message:"Email Atau Password Salah"
			});
		}else{
			let snap = new midtransClient.Snap({
				isProduction : false,
				serverKey : 'SB-Mid-server-Jp5xMM57FoclHmWDItzXwXaV',
				clientKey : 'SB-Mid-client-JUvzbHgzcPxluJEa'
			});
			let parameter = {
				"transaction_details": {
					"order_id": result.rows[0].email_user+"-"+Math.round((new Date()).getTime()/1000),
					"gross_amount": 10000
				}, "credit_card":{
					"secure" : true
				}
			};
			// create snap transaction token
			snap.createTransactionToken(parameter).then((transactionToken)=>{
			// pass transaction token to frontend
				res.render('simple_checkout',{
					token: transactionToken, 
					clientKey: snap.apiConfig.clientKey,
					user: result.rows[0].email_user
				})
			})
		}
	});
})

app.post("/success", async function(req,res){
    console.log(`- Received check transaction status request:`,req.body);
    let core = new midtransClient.Snap({
        isProduction : false,
        serverKey : 'SB-Mid-server-Jp5xMM57FoclHmWDItzXwXaV',
        clientKey : 'SB-Mid-client-JUvzbHgzcPxluJEa'
    });

    core.transaction.status(req.body.transaction_id)
    .then((transactionStatusObject)=>{
      let orderId = transactionStatusObject.order_id;
      let transactionStatus = transactionStatusObject.transaction_status;
      let fraudStatus = transactionStatusObject.fraud_status;

      let summary = `Transaction Result. Order ID: ${orderId}. Transaction status: ${transactionStatus}. Fraud status: ${fraudStatus}.<br>Raw transaction status:<pre>${JSON.stringify(transactionStatusObject, null, 2)}</pre>`;

      // [5.A] Handle transaction status on your backend
      // Sample transactionStatus handling logic
      if (transactionStatus == 'capture'){
          if (fraudStatus == 'challenge'){
              // TODO set transaction status on your databaase to 'challenge'
          } else if (fraudStatus == 'accept'){
              // TODO set transaction status on your databaase to 'success'
            let user = orderId.split("-");
	        con.query("select * from users where email_user= $1",[user[0]],function(err,result,fields){
		        if(result.rows == 0) {
			        return res.status(400).send({
				        status:400,
				        message:"Email Atau Password Salah"
		    	    });
		        }else{
			        let api_hit = result.rows[0].api_hit + 10;
			        con.query(`update users set api_hit=$1 where email_user=$2`,[api_hit,user[0]],function(err,result,fields){
                        if(result.rows == 0){
					        return res.status(400).send({status:400,message:"Topup Gagal"});
				        }else{
					        return res.status(200).send({status:200,message:"Topup Berhasil Dilakukan"});
				        }
			        });
		        }
	        });
          }
      } else if (transactionStatus == 'settlement'){
        // TODO set transaction status on your databaase to 'success'
        // Note: Non card transaction will become 'settlement' on payment success
        // Credit card will also become 'settlement' D+1, which you can ignore
        // because most of the time 'capture' is enough to be considered as success
      } else if (transactionStatus == 'cancel' ||
        transactionStatus == 'deny' ||
        transactionStatus == 'expire'){
        // TODO set transaction status on your databaase to 'failure'
      } else if (transactionStatus == 'pending'){
        // TODO set transaction status on your databaase to 'pending' / waiting payment
      } else if (transactionStatus == 'refund'){
        // TODO set transaction status on your databaase to 'refund'
      }
      console.log(summary);
      res.send(JSON.stringify(transactionStatusObject, null, 2));
    });
})

//Edit User Review
app.put("/editReview",async function(req,res){
    const editreview = req.body.review;
    const email_user = req.body.email_user;
    const review_id  = req.body.review_id;
    const api_key = req.body.api_key;

    con.query(`select * from users where email_user=$1 and key_user =$2`,[email_user,api_key],function(err,result,fields){
        if(result.rows == 0) return res.status(403).send({status:403,message:"Error 403 : Forbidden, only member can edit review"});
        else{
            con.query("update review set review = $1 where review_id=$2",[editreview,review_id],function(err,rows,fields){
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

    con.query("select * from review where anime_id = $1 and status = 1",[anime_id],function(err,result,fields){
        if(result.rows == 0){
            return res.status(404).send({status:404,message:"No review found"});
        } else{
            return res.status(200).send({status:200,message:result.rows});
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
        var animelist = [];
        for (var i=0;i<10;i++){
            var animedata = [];
            animedata.push(rando.data[i].attributes.titles.en);
            animedata.push(rando.data[i].attributes.synopsis);
            animelist.push(animedata);
        }
        res.status(200).send({status:200,message:animelist});
    } catch (error) {
        res.send(error);
    }
});

//getCategories
app.get("/getCategories", async function(req,res){
    try {
        const rando = JSON.parse(await getCategories());
        var categorylist = [];
        for (var i=0;i<10;i++){
            categorylist.push(rando.data[i].attributes.title);
        }
        res.status(200).send({status:200,message:categorylist});
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
        res.status(200).send({status:200,message:animelist});
    } catch(error){
        res.send(error);
    }
    
})

module.exports = app;

