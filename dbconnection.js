const mongoose=require("mongoose");
mongoose.connect('mongodb://localhost:27017/m3text',{useNewUrlParser:true,useUnifiedTopology:true},(error,result)=>{
    if(error){
        console.log('Data is not connected');
    }else{
        console.log('Data is connected successfully..');
    }
})