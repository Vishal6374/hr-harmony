import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

const createTransporter = async () => {
    // If no host provided, use Ethereal for testing
    if (!config.email.host) {
        console.log('No SMTP host provided, using Ethereal for testing email...');
        const testAccount = await nodemailer.createTestAccount();
        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    }

    return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
            user: config.email.user,
            pass: config.email.password,
        },
    });
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        const transporter = await createTransporter();

        const message = {
            from: config.email.from,
            to: options.to,
            subject: options.subject,
            html: options.html,
        };

        const info = await transporter.sendMail(message);

        console.log(`Message sent: ${info.messageId}`);

        // Preview only available when sending through an Ethereal account
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log(`Preview URL: ${previewUrl}`);
        }
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Email sending failed');
    }
};
