import express from 'express'
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv'
import axios from 'axios';
dotenv.config()
const adminrouter = express();

const prisma = new PrismaClient();
adminrouter.delete('/deleteuser',async(req:any,res:any)=>{
    
    try{
    
       await prisma.user.deleteMany({})
       return res.json({
        msg:"User deleted!!"
       })
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            msg:err
        })
    }
   
})

adminrouter.delete('/deletepurchase',async(req:any,res:any)=>{
    try{
       await prisma.purchase.deleteMany({})
       return res.json({
        msg:"Delete purchase"
       })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            error:err
        })
    }
})

module.exports = adminrouter