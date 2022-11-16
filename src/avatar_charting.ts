import { Avatars } from './models/avatar'
import { AvatarTimeSeries } from './models/avatar_timeseries'

export module AvatarCharter {
    export async function chart() {
        const avatars = await Avatars.find({}, 'name slug floor_price last_sale').lean();
        const timeseries = await AvatarTimeSeries.find({});
        const currentTime = new Date();
        const expireTime = new Date(currentTime.getTime() + 86340000) //23 hours and 59 minutes from currentTime

        for(let timeserie of timeseries) {
            //Remove elements that have expired
            //Arrays is already in chronological order
            while(timeserie.floor_prices.length > 0) {
                if(timeserie.floor_prices[0].expireAt !== undefined && timeserie.floor_prices[0].expireAt.getTime() > currentTime.getTime()) {
                    break;
                }
                timeserie.floor_prices.shift();
            }
            while(timeserie.last_sales.length > 0) {
                if(timeserie.last_sales[0].expireAt !== undefined && timeserie.last_sales[0].expireAt.getTime() > currentTime.getTime()) {
                    break;
                }
                timeserie.last_sales.shift();
            }

            //Append the most recent price to the timeserie.
            const avatar = await findAvatar(avatars, timeserie.name, timeserie.slug);
            timeserie.floor_prices.push({
                amount: avatar?.floor_price,
                expireAt: expireTime
            });
            timeserie.last_sales.push({
                amount: avatar?.last_sale,
                expireAt: expireTime
            });
            timeserie.save();
        }
        
        console.log("Completed updating timeseries");
    }

    async function findAvatar(avatars: any, name: string, slug: string): Promise<any> {
        for(let avatar of avatars) {
            if(avatar.name === name && avatar.slug === slug) {
                return avatar;
            }
        }
        throw new Error("Cannot find avatar");
    }
}