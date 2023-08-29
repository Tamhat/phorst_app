import mongoose from 'mongoose'

let isConencted = false

export const connectToDB = async () => {
    mongoose.set('strictQuery',true)
    if(!process.env.MONGODB_URL) return console.log('No MONGODB_URL found')
    if(isConencted) return console.log('Already connected to DB')

    try{
        await mongoose.connect(process.env.MONGODB_URL)
        isConencted = true
    }
    catch(error){
console.log(error)
    }

}