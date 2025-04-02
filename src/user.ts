import express from 'express'



import { PrismaClient } from '@prisma/client';
import twilio from 'twilio';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
import multer from 'multer'
const userrouter = express();
const prisma = new PrismaClient();

dotenv.config()

function Middleware(req:any,res:any,next:any)
{
    const BearerToken = req.headers['authorization'];

    if (!BearerToken || !BearerToken.startsWith('Bearer ')) {
        return res.status(401).json({ msg: "Token is required!" });
    }


    const token = BearerToken.split(' ')[1];

   

    try{
        const decode = jwt.verify(token,process.env.secret_key || "");

        if(decode){
             next();
        }
        else{
            return res.json({
                msg:"Access disgranted!!"
            })
        }
    }
    catch(err){
        console.error("JWT verification error:", err);
        return res.status(500).json({
            msg:"Error while Authentication"  + err
        })
    }
}

userrouter.post('/createuser',async(req:any,res:any)=>{

const {name,password,email,number,role,Class} = req.body;

 if(!name || !password || !email || !number || !Class){
    return res.json({
        msg:"Fields are missing"
    })
 }



 try{

// Check if user already exists
const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: email },
        { number: number }
      ]
    }
  });
if(existingUser){
    return res.json({
        msg:"User already exists!!"
    })
}

const Promocode = name.substring(0,4) + Math.floor(1000 + Math.random()*9000); 
const newUser = await prisma.user.create({
    data: {
      name,
      email,
      password,
      number,
      role:role,
      promocode:Promocode,
      class:Number(Class)
    },
  });
  console.log(newUser)
  return res.json({
    msg:"User created Successfully!"
    ,newUser
  })

    }
 catch(err){
    console.error(err)
    return res.status(500).json({
        msg:err
    })
 }
})


// userrouter.get('/getpromo',async(req:any,res:any)=>{
//     const userid = req.query.id;
//     if(!userid){
//         return res.json({
//             msg:"All fields required"
//         })
//     }
//     try{
//       const user = await prisma.user.findUnique({
//         where:{
//             id:Number(userid)
//         },
//         select:{
//             promocode:true
//         }
//       })

//       return req.json({
//         promocode:user?.promocode
//       })
//     }
//     catch(err){
//         console.log(err)
//         return res.status(500).json({
//             msg:err
//         })
//     }
// })




userrouter.post("/checknumber",async(req:any,res:any)=>{
    const number = req.body.number;
    if(!number){
        return res.json({
            msg:"Number not found!!"
        })
    }

    try{
        const exist = await prisma.user.findUnique({
            where:{
                number:number
            }
        })

       

        if(!exist){
            return res.json({
                status:false
            })
        }
        return res.json({
            status:true,
            role:exist.role
            
            
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})
userrouter.get('/checkpassword',async(req:any,res:any)=>{
    const password = req.query.password;
    const number = req.query.number
    if(!password || !number){
        return res.json({
            msg:"data empty!!"
        })
    }

    try{
        const user = await prisma.user.findUnique({
            where:{
                number:number,
                password:password
            }
        })
        if(!user){
            return res.json({
                msg:"Wrong password , please enter correct password.",
                status:false
            })
        }
        const token = jwt.sign({number,password},process.env.secret_key || "");
        

        return res.json({
            status:true,
            token,
            userid:user.id,
            Class:user.class
        })
        
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})

// client setup for otp
// const client = twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
// userrouter.post('/send-otp',async(req:any,res:any)=>{
   
//     const {phonenumber} = req.body;
//     const otp = Math.floor(100000 + Math.random() * 900000);
//     console.log(phonenumber)

// console.log(process.env.TWILIO_PHONE_NUMBER)
    
// try{
//     const user = await prisma.user.findUnique({
//         where:{
//             number:phonenumber
//         }
//     })

//     await client.messages.create({
//         body: `Your OTP code is ${otp}`,
//         from: process.env.TWILIO_PHONE_NUMBER,
//         to: '+91'+phonenumber
//       });
//       const token = jwt.sign({number:phonenumber},process.env.secret_key || "");
//       console.log("Token after login. ->",token);
    
//       res.status(200).json({ success: true, otp ,token,id:user?.id });
// }
// catch (err) {
//     console.error("Error sending OTP:", err);
//     res.status(500).json({ success: false, error: err });
//   }
// })
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
userrouter.post('/send-otp', async (req:any, res:any) => {
    // Validate and sanitize input
    const { phonenumber } = req.body;
    const cleanedNumber = String(phonenumber).replace(/\D/g, '').slice(-10); // Keep last 10 digits
    
    // Validate Indian mobile number
    if (!/^[6-9]\d{9}$/.test(cleanedNumber)) {
      return res.status(400).json({ 
        success: false,
        error: 'Please enter a valid 10-digit Indian mobile number'
      });
    }
  
    try {
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const fullNumber = `+91${cleanedNumber}`;
      
      // Check user existence
      const user = await prisma.user.findUnique({
        where: { number: cleanedNumber },
        select: { id: true }
      });
  
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'Mobile number not registered'
        });
      }
  
      // Production: Send via Twilio | Development: Log to console
      if (process.env.NODE_ENV === 'production') {
        try {
          await client.messages.create({
            body: `Your OTP is: ${otp}. Valid for 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: fullNumber
          });
        } catch (twilioError:any) {
          // Handle trial account restrictions gracefully
          if (twilioError.code === 21608) {
            console.warn(`Twilio trial restriction for ${fullNumber}`);
          } else {
            throw twilioError;
          }
        }
      } else {
        console.log(`[DEV] OTP for ${fullNumber}: ${otp}`);
      }
  
      // Generate JWT token
      const token = jwt.sign(
        { 
          number: cleanedNumber,
          otp: otp, // Include OTP in token for verification
          purpose: 'otp_verification'
        },
        process.env.JWT_SECRET || "",
        { expiresIn: '5m' } // Short expiration for OTP
      );
  
      return res.json({
        success: true,
        message: process.env.NODE_ENV === 'production' ? 
          'OTP sent successfully' : 
          `DEV: OTP is ${otp}`,
        token,
        userId: user.id,
        // Only return OTP in development
        ...(process.env.NODE_ENV !== 'production' && { otp })
      });
  
    } catch (error) {
      console.error('OTP sending failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process OTP request',
        ...(process.env.NODE_ENV === 'development' && { 
          details: error 
        })
      });
    }
  });
userrouter.get('/checkPromo',async(req:any,res:any)=>{
    const code = req.query.code;
    const id = req.query.userid;
    if(!code || !id){
        return res.json({
            msg:"Code and id required"
        })
    }
    

    try{
        const user = await prisma.user.findUnique({
            where:{
                id:Number(id)
            }
        })

        if(user?.promocode === code){
            return res.json({
                status:false
            })
        }

        const find = await prisma.user.findFirst({
            where:{
                promocode:code
            }
        });
    
        if(!find){
            return res.json({
                msg:"Promo code doesn't exist!!"
            })
        }
    
        return res.json({
            status:true
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})

userrouter.get('/details',async(req:any,res:any)=>{
    const number = req.query.number;

    if(!number)
    {
        return res.json({msg:"Number not got!!"})
    }

    try{
      const user = await prisma.user.findUnique({
        where:{
            number:number
        }
      })

      return res.json({
        user
      })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
})

userrouter.put('/changepassword',async(req:any,res:any)=>{
    const number = req.body.number;
    const newpass = req.body.newpass
    if(!number){
        return res.json({msg:"Number required!!"})
    }

    try{
       const newpassword = await prisma.user.update({
        where:{
            number:number
        },
        data:{
             password:newpass
        }
       })

       return res.json({newpass})
    }
    catch(err){
       console.log(err)
       return res.status(500).json({error:err})
    }
})


// link pasting..
userrouter.post('/linkpasting',async(req:any,res:any)=>{
    const link = req.body.link
    const Class = req.body.Class

    console.log(link)
    if(!link || !Class){
        return res.json({
            msg:"Link and class required!!"
        })
    }

    try{
      const all = await prisma.link.deleteMany({
        where:{
            class:Number(Class)
        }
      });

      const Newlink = await prisma.link.create({
        data:{
            link:link,
            class:Number(Class)
        }
      })

      res.json({ success: true, message: "Class link updated!", data: Newlink });
    }
    catch(err){
        res.status(500).json({ success: false, message: "Error updating link", err });
    }
})

userrouter.get("/getlatestlink",async(req:any,res:any)=>{

    const Class = req.query.Class;
    if(!Class){
        return res.json({
            msg:"Class field is required"
        })
    }
    try{
        const latest = await prisma.link.findFirst({
            where:{
                class:Number(Class)
            },
            orderBy:{createdAt:'desc'}
        })

        if(!latest){
            return res.json({ success: false, message: "No active class link found" });
        }
        return res.json({success:true,link:latest.link});
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error fetching link", error });
    }
})


userrouter.post('/addpurchase',async(req:any,res:any)=>{
    const {name,number,transactionid ,installment} = req.body;
    if(!name || !number || !transactionid || !installment){
        return res.json({
            msg:"Full data required"
        })
    }

    try{

        const exist = await prisma.purchase.findUnique({
            where:{
                purchaseid:transactionid
            }
        })

        if(exist){
            return res.json({
                msg:"Transaction already exists!!"
            })
        }
         const response = await prisma.purchase.create({
            data:{
                name:name,
                number:number,
                purchaseid:transactionid,
                Installment:Number(installment)
            }
         })

         console.log(response)

         return res.json({
            msg:"Purchase made, you will get a Confirmation Email after Successfully Varified!!"
         })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }

})

// Configure mail transporter
const transporter = nodemailer.createTransport({
    service: "gmail", // You can use SMTP or other services like SendGrid, Mailgun
    auth: {
      user: "astavakraacademy@gmail.com", // Your email
      pass: "ugzi pscp rmao exnv" // App password if using Gmail
    }
  });
  const upload = multer({ storage: multer.memoryStorage() }); // Store in memory (not on disk)

 userrouter.post('/sendMail',upload.single('screenshot'),async(req:any,res:any)=>{
         const {name,number,transactionid,installment,promo} = req.body;
          console.log( req.body);
          console.log( req.file);
         const screenshot = req.file

         try{
            const mailOptions = {
                from: 'astavakraacademy@gmail.com',
                to: "astavakraacademy@gmail.com", // Admin Email
                subject: "New Payment Submission",
                html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Phone Number:</strong> ${number}</p>
                <p><strong>Transaction ID:</strong> ${transactionid}</p>
                 <p><strong>${installment === '0' ? 'Paid all one time , No Installments':'installment number ' + installment}:</strong></p>
                  <p><strong>${promo === 'applied' ? 'Promo code applied!!':'Promo code not applied!!'}</strong></p>
                 
              `,
              attachments: [
                {
                  filename: screenshot.originalname,
                  content: screenshot.buffer, // Directly send the image buffer
                },
              ],
            }

            await transporter.sendMail(mailOptions);

            res.json({ success: true, message: "Email sent Successfully!!" });
         }
         catch(err){
            
            console.error("Error:", err);
            res.status(500).json({ success: false, message: "Error submitting payment details!" });
        }
 }) 
 userrouter.put('/varifytrue',async(req:any,res:any)=>{
    const id = req.query.id;
    if(!id){
        return res.json({
            msg:"Id required!!"
        })
    }

    try{
       const response = await prisma.purchase.update({
        where:{
            id:Number(id)
        },
        data:{verify:true}
       })

       const user = await prisma.user.findUnique({
        where:{
            number:response.number
        }
       })
       console.log(user)

       const mailOptions = {
        from: 'astavakraacademy@gmail.com',
        to:'astavakraacademy@gmail.com', // Admin Email
        subject: "Payment Varified!!",
        html: `
        <p>Hello,${user?.name}</p>
        <p>Congratulations!! , Your access to The Course has granted</p>
        <p>You can now login to your account and can attend live lectures.</p>
        <p>Best regards, <br>Ashtavakra Academy</p>
      `
       }

       await transporter.sendMail(mailOptions);

       return res.json({msg:"Varified!!"})
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.get('/getpending',async(req:any,res:any)=>{
    try{
          const all = await prisma.purchase.findMany({
            where:{
               verify:false 
            }
          })

          console.log(all)
          return res.json({
            all:all
          })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            msg:"Error is " + err
        })
    }
 })

//  Demo wali routes
 userrouter.get('/checkDemoaccess',async(req:any,res:any)=>{
    const id = req.query.id;
    if(!id){
        return res.json({
            msg:"Id required"
        })
    }

    try{  
        const find = await prisma.user.findUnique({
            where:{
                id:Number(id)
            },
            select:{
                hasAccess:true,
                demoEnd:true
            }
        })

        return res.json({
            success:find?.hasAccess,
            demoEnd:find?.demoEnd
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.post('/start-demo',async(req:any,res:any)=>{
    const {userid} = req.body;
    const now = new Date()
    const demoEnd = new Date(now);
    demoEnd.setDate(demoEnd.getDate() + 4);// 4 din bad ka time set kar rahe hain

    try{
       const user =  await prisma.user.update({
            where:{
                id:Number(userid)
            }
            ,
            data:{
                demoStart:now,demoEnd:demoEnd,
                hasAccess:true
            }
        })
        console.log(user)
        res.json({ success: true, message: "Demo started successfully!" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Error starting demo",error:error });
    }
 })

 userrouter.put('/setAccessfalse',async(req:any,res:any)=>{
    const id = req.query.id;
    if(!id){
        return res.json({
            msg:"Id required!!"
        })
    }

    try{
        await prisma.user.update({
            where:{id:Number(id)},
            data:{hasAccess:false}
        })
    }
    catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.get('/IsPayVerified',async(req:any,res:any)=>{
    const number = req.query.number;
     if(!number){
        return res.json({
            msg:'Number required!!'
        })
     }
     try{
        const access = await prisma.purchase.findMany({
            where:{
                number:number
            },
            select:{
                verify:true
            }
        })

        let check = false;
        for(let i=0;i<access.length;i++){
             if(access[i].verify){
                check=true;
                break;
             }
        }
        console.log("The access are ",access)

        return res.json({
            success:check
        })
     }
     catch(err){
        console.log(err)
        return res.status(500).json({
            msg:err
        })
     }
 })

 userrouter.delete('/removelastLink',async(req:any,res:any)=>{
    const Class = req.query.Class
    if(!Class){
        return res.json({
            msg:"Class is required"
        })
    }
    try{ 
         await prisma.link.deleteMany({
            where:{class:Number(Class)}
         });
         return res.json({
            msg:"Last link deleted!!"
         })
    }
    catch(err){
        console.log(err)
        res.status(500).json({
            msg:err
        })
    }
 })
 userrouter.get('/getall',async(req:any,res:any)=>{
    const all = await prisma.user.findMany({})
    return res.json({
        all
    })
 })

 
module.exports = userrouter
