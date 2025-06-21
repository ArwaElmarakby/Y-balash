// // const mongoose = require('mongoose');

// // const connectDB = async () => {
// //     try {
// //         await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
// //         console.log('MongoDB Connected...');
// //     } catch (err) {
// //         console.error(err.message);
// //         process.exit(1);
// //     }
// // };

// // module.exports = connectDB;





// // const mongoose = require('mongoose');

// // const connectDB = async () => {
// //     try {
// //         await mongoose.connect('mongodb+srv://arwaelmarakbyy:AfwttMWj9uVU9edA@cluster0.x1nha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'); 
// //         console.log('MongoDB connected');
// //     } catch (err) {
// //         console.error('Error connecting to MongoDB:', err.message);
// //         process.exit(1);
// //     }
// // };

// // module.exports = connectDB;





// const mongoose = require('mongoose');

// const connectDB = async () => {
//     try {
//         await mongoose.connect('mongodb+srv://arwaelmarakbyy:AfwttMWj9uVU9edA@cluster0.x1nha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'); 
//         console.log('MongoDB connected');
//     } catch (err) {
//         console.error('Error connecting to MongoDB:', err.message);
//         process.exit(1);
//     }
// };

// module.exports = connectDB;

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://arwaelmarakbyy:AfwttMWj9uVU9edA@cluster0.x1nha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'); 
        console.log('MongoDB connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
