import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      // "mongodb+srv://gaurav989267:BFY6ZpXufyXVurU2@cluster0.rc8bpto.mongodb.net/helpdesk?retryWrites=true&w=majority"
      "mongodb://127.0.0.1:27017/helpdesk"
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
};

export default connectDB;
