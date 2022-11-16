import dotenv from 'dotenv'
import cron from 'node-cron'

import { Database } from './config/db'
import { AvatarCharter } from './avatar_charting'

dotenv.config();
Database.connect();

//Update 24 hour avatar spreadsheet every 30 minutes
cron.schedule('*/30 * * * *', () => { AvatarCharter.chart() });