import { v2 as cloudinary, ConfigOptions } from "cloudinary";

const config: ConfigOptions = {
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
};

const missingVars = Object.entries(config).filter(([, value]) => !value);

if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.map(([key]) => key).join(", ")}`);
}

cloudinary.config(config);

export { cloudinary };