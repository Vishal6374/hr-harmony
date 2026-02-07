import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { Resend } from "resend";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resend = new Resend(env.RESEND_API_KEY);

  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      react(),
      {
        name: 'serverless-contact-actual',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/contact' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk.toString(); });
              req.on('end', async () => {
                try {
                  const { name, email, message, company } = JSON.parse(body);

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
                          <div style="background: #f4f4f4; padding: 15px; border-radius: 15px;">
                              ${message.replace(/\n/g, '<br/>')}
                          </div>
                      </div>
                    `,
                  });

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true, message: "Email sent successfully via Resend!" }));
                } catch (error: any) {
                  console.error("Vite Middleware Error:", error);
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, message: error.message }));
                }
              });
            } else {
              next();
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
