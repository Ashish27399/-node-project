const jwt=require('jsonwebtoken');
const usermodel=require('../model/usermodel');
module.exports={
    userVerify:(req,res,next)=>{
        jwt.verify(req.headers.token,'secretkey',function(tokenErr,tokenRes){
            if(tokenErr){
                console.log(tokenErr);
                return res.send({responseCode:500,responseMessage:"Internal server error",responseResult:tokenErr});
            }else{
                usermodel.findOne({_id:tokenRes._id},(error,result)=>{
                    if(error){
                        return res.send({responseCode:500,responseMessage:"Internal server error"});
                    }else if(!result){
                        return res.send({responseCode:409,responseMessage:"Data not founds"});
                    }else{
                        if(result.status=="DELETE"){
                            return res.send({responseCode:500,responseMessage:"your data has been deleted"});
                        }else if(result.status=="BLOCK"){
                            return res.send({responseCode:500,responseMessage:"your account has been Block"});                            
                        }else{
                            req.userId=result._id;
                            next();
                        }
                    }
                })
            }
        })
    }
}