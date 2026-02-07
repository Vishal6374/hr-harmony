import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

export default async function handler(req: any, res: any) {
    // Basic routing for serverless function
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    try {
        const { name, email, message, company } = req.body || {};

        if (!name || !email || !message) {
            return res.status(400).json({ message: "All fields required" });
        }

        await resend.emails.send({
            from: "Catalyr <contact@catalyr.com>",
            to: ["catalyr06@gmail.com"],
            subject: `New Contact — ${name}`,
            html: `
                <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
                    <h2>New Demo Request</h2>
                    <p><b>Name:</b> ${name}</p>
                    <p><b>Email:</b> ${email}</p>
                    <p><b>Company:</b> ${company || 'N/A'}</p>
                    <p><b>Message:</b></p>
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 5px;">
                        ${message.replace(/\n/g, '<br/>')}
                    </div>
                </div>
            `,
        });

        return res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (error: any) {
        console.error("Serverless Email Error:", error);
        return res.status(500).json({ message: "Email failed", error: error.message });
    }
}
