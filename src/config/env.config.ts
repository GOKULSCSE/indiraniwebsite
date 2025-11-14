import dotenv from 'dotenv';
dotenv.config();

interface EnvConfig {
  DATABASE_URL: string;
}
const envConfig: EnvConfig = {
  DATABASE_URL: process.env.DATABASE_URL || '',
};

export default envConfig;