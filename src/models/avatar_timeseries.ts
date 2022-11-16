import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    floor_prices: [{
        amount: {
            type: Number
        },
        expireAt: {
            type: Date
        }
    }],
    last_sales: [{
        amount: {
            type: Number
        },
        expireAt: {
            type: Date
        }
    }]
})

export const AvatarTimeSeries = mongoose.model('AvatarTimeSeries', Schema);