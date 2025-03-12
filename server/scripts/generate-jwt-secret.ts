import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Generate a secure random string for JWT secret
const generateJWTSecret = (): string => {
    return crypto.randomBytes(64).toString('hex');
};

// Update the .env file with the new JWT secret
const updateEnvFile = (newSecret: string) => {
    const envPath = path.join(__dirname, '../.env');
    
    try {
        // Read the current .env content
        const envContent = fs.readFileSync(envPath, 'utf8');
        
        // Replace the JWT_SECRET line while preserving other settings
        const updatedContent = envContent.replace(
            /JWT_SECRET=.*/,
            `JWT_SECRET=${newSecret}`
        );
        
        // Write the updated content back to .env
        fs.writeFileSync(envPath, updatedContent);
        console.log('Successfully updated JWT_SECRET in .env file');
    } catch (error) {
        console.error('Error updating .env file:', error);
        process.exit(1);
    }
};

// Main execution
const main = () => {
    const newSecret = generateJWTSecret();
    updateEnvFile(newSecret);
    console.log('New JWT secret has been generated and configured');
};

main();