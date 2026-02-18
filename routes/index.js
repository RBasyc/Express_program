let express=require('express');
let Router =express.Router();

Router.get('/',(req,res)=>{
  res.render('index', { title: 'Express' });
});