// const twilio = require('twilio');


// const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACc75afe5465ef371f363e71111faa4984'; 
// const authToken = process.env.TWILIO_AUTH_TOKEN || '202390c9fbbecc0a314d0b9b188b22b9'; 
// const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+201020436643';

// const client = twilio(accountSid, authToken);

// const sendOtp = async (phone, otpCode) => {
//     try {
        
//         const message = await client.messages.create({
//             body: `Your OTP code is: ${otpCode}`,
//             from: twilioPhoneNumber, 
//             to: phone, 
//         });

//         console.log(`OTP sent successfully: SID = ${message.sid}`);
//     } catch (error) {
//         console.error('Error sending OTP via Twilio:', error.message);
//     }
// };

// module.exports = sendOtp;




const twilio = require('twilio');


const accountSid = process.env.TWILIO_ACCOUNT_SID || 'ACc75afe5465ef371f363e71111faa4984'; 
const authToken = process.env.TWILIO_AUTH_TOKEN || '202390c9fbbecc0a314d0b9b188b22b9'; 
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER || '+201020436643';

const client = twilio(accountSid, authToken);

const sendOtp = async (phone, otpCode) => {
    try {
        
        const message = await client.messages.create({
            body: `Your OTP code is: ${otpCode}`,
            from: twilioPhoneNumber, 
            to: phone, 
        });

        console.log(`OTP sent successfully: SID = ${message.sid}`);
    } catch (error) {
        console.error('Error sending OTP via Twilio:', error.message);
    }
};

module.exports = sendOtp;