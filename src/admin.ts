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

const crypto = require("crypto");

adminrouter.post("/payment/webhook", async (req, res) => {
  const secret = "mywebhooksecret123";
  const body = JSON.stringify(req.body);
  const signature = req.headers["x-razorpay-signature"];

  const expectedSignature = crypto
    .createHmac("sha256", secret!)
    .update(body)
    .digest("hex");

  const isAuthentic = expectedSignature === signature;

  if (isAuthentic) {
    const event = req.body;

    if (event.event === "payment.captured") {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.order_id;

      await prisma.purchase.updateMany({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status: "SUCCESS",
        },
      });

    } else if (event.event === "payment.failed") {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.order_id;

      await prisma.purchase.updateMany({
        where: { razorpayOrderId: orderId },
        data: {
          razorpayPaymentId: paymentId,
          status: "FAILED",
        },
      });
    }

    res.status(200).json({ status: "ok" });
  } else {
    res.status(400).json({ status: "invalid signature" });
  }
});

module.exports = adminrouter
