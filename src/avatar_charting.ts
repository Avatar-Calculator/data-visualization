import axios from 'axios'
import AES from 'crypto-js/aes'

import { Avatars } from './models/avatar'
import { AvatarTimeSeries } from './models/avatar_timeseries'

export module AvatarCharter {
    export async function chart() {
        const avatars = await Avatars.find({}, 'name slug floor_price last_sale').lean();
        const timeseries = await AvatarTimeSeries.find({});
        const currentTime = new Date();
        const expireTime = new Date(currentTime.getTime() + 86340000) //23 hours and 59 minutes from currentTime

        const promises = [];

        for(let timeserie of timeseries) {
            //Remove elements that have expired
            //Arrays is already in chronological order
            while(timeserie.timeseries.length > 0) {
                if(timeserie.timeseries[0].expireAt !== undefined && timeserie.timeseries[0].expireAt.getTime() > currentTime.getTime()) {
                    break;
                }
                timeserie.timeseries.shift();
            }

            //Append the most recent price to the timeserie.
            const avatar = await findAvatar(avatars, timeserie.name, timeserie.slug);
            timeserie.timeseries.push({
                floor_price: avatar?.floor_price,
                last_sale: avatar?.last_sale,
                createdAt: currentTime,
                expireAt: expireTime
            });
            promises.push(timeserie.save());
        }
        await Promise.all(promises);
        console.log("Completed updating timeseries at " + new Date().toISOString());

        //Notify the server to update its timeseries
        if(process.env.APP_AES_SECRET !== undefined) {
            var encryptedAES = AES.encrypt(process.env.APP_AES_SECRET, process.env.APP_AES_SECRET).toString();
            const domain = process.env.DOMAIN || "http://localhost:3000";
            axios.post(domain.concat("/api/private/timeseries"), { ciphertext: encryptedAES });
        }
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