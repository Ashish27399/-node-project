const staticModel=require('../model/staticModel');
module.exports={
    staticList:async(req,res)=>{
        try{
          let query = {status:'ACTIVE'}
          let staticData = await staticModel.find(query);
          if(staticData.length!=0){
            res.send({responseCode:200,responseMessage:'Static data found!',responseResult:staticData})
          }
          else{
            res.send({responseCode:404,responseMessage:'Static data not found!',responseResult:[]})
          }
        }catch(error){
          res.send({responseCode:501,responseMessage:'Something went wrong!',responseResult:error.message})
        }
      },
    staticView:async(req,res)=>{
        try{
          let query = {type:req.params.type,status:'ACTIVE'}
          let staticData = await staticModel.find(query);
          if(staticData.length!=0){
            res.send({responseCode:200,responseMessage:'Static data found!',responseResult:staticData})
          }
          else{
            res.send({responseCode:404,responseMessage:'Static data not found!',responseResult:[]})
          }
        }catch(error){
          console.log('listZStatic ==>',error);
          res.send({responseCode:501,responseMessage:'Something went wrong!',responseResult:error.message})
        }
      },
    staticEdit:async(req,res)=>{
        try{
     let result=await staticModel.findOne({type:req.body.type,status:"ACTIVE"})
           if(!result){
             return res.send({resopnseCode:404,responseMessage:'Data not found '});
         }else{
            let updateRes=await staticModel.findByIdAndUpdate({_id:result._id},{$set:{title:req.body.title,description:req.body.description}},{new:true})
             return res.send({resopnseCode:200,responseMessage:"Successfully static data edit ",resopnseResult:updateRes});
                }
            }catch(error){
                return res.send({resopnseCode:501,responseMessage:'something went wrong', resopnseResult:error.message});
            }
      
    },
    staticActive:async(req,res)=>{
        try{
        let result=await staticModel.findOne({_id:req.params._id,status:req.params.status})   
        if(!result){
                return res.send({responseCode:404,responseMessage:"Data is not found",responseResult:[]});
            }else{
                if(result.status=="ACTIVE"){
                    let result1=await staticModel.findByIdAndUpdate({_id:result._id},{$set:{status:"BLOCK"}},{new:true})
                       return res.send({responseCode:200,responseMessage:"Block successfully",resopnseResult:result1});
                   }else{
                    return res.send({responseCode:409,responseMessage:"Already Block"});
                 }
            }}
        catch{
            return res.send({responseCode:501,responseMessage:"something went wrong",responseResult:error.message});
        }
    },
    staticBlock:async(req,res)=>{
        try{
            let result=await staticModel.findOne({_id:req.params._id})
            if(!result){
                return res.send({responseCode:404,responseMessage:"Data is not found"});
            }else{
                if(result.status=="BLOCK"){
                  let update=await  staticModel.findByIdAndUpdate({_id:result._id},{$set:{status:"ACTIVE"}},{new:true})
                         return res.send({responseCode:200,responseMessage:"Active successfully",resopnseResult:updateRes});
                        }else{
                    return res.send({responseCode:409,responseMessage:"Already ACTIVE",responseResult:[]});
                }
            }}
            catch(error){
                return res.send({responseCode:501,responseMessage:"something went wrong",responseResult:error.message});
            }
        }  
    
}