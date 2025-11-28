import { createCanvas, loadImage } from 'canvas';
import { z } from 'zod';

export async function POST({ request }: { request: Request }) {
    try {
        const body = await request.json();

        const schema = z.object({
            imageBase64: z.string(),
            text: z.string().optional(),
            textX: z.number().optional().default(20),
            textY: z.number().optional().default(40),
            textColor: z.string().optional().default('#FF0000'),
            textSize: z.number().optional().default(32),
            drawLines: z.array(z.object({
                x1: z.number(),
                y1: z.number(),
                x2: z.number(),
                y2: z.number(),
                color: z.string().optional().default('#FF0000'),
                width: z.number().optional().default(2)
            })).optional().default([]),
            drawCircles: z.array(z.object({
                x: z.number(),
                y: z.number(),
                radius: z.number(),
                color: z.string().optional().default('#FF0000'),
                fill: z.boolean().optional().default(false)
            })).optional().default([])
        });

        const { imageBase64, text, textX, textY, textColor, textSize, drawLines, drawCircles } = schema.parse(body);

        // Decode base64 image
        const imageBuffer = Buffer.from(imageBase64, 'base64');
        const image = await loadImage(imageBuffer);

        // Create canvas matching image dimensions
        const canvas = createCanvas(image.width, image.height);
        const ctx = canvas.getContext('2d');
console.log("ran ctx 2d");
        // Draw original image
        ctx.drawImage(image, 0, 0);

        // Draw lines
        drawLines.forEach(line => {
            ctx.strokeStyle = line.color;
            ctx.lineWidth = line.width;
            ctx.beginPath();
            ctx.moveTo(line.x1, line.y1);
            ctx.lineTo(line.x2, line.y2);
            ctx.stroke();
        });
console.log("drew lines");
        // Draw circles
        drawCircles.forEach(circle => {
            ctx.fillStyle = circle.color;
            ctx.strokeStyle = circle.color;
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2);
            if (circle.fill) ctx.fill();
            else ctx.stroke();
        });
console.log("circles drawn");
        // Draw text
        if (text) {
            ctx.fillStyle = textColor;
            ctx.font = `bold ${textSize}px Arial`;
            ctx.fillText(text, textX, textY);
        }
console.log("text drawn");
        // Convert back to base64
        const resultBase64 = canvas.toBuffer('image/png').toString('base64');

        return new Response(JSON.stringify({ imageBase64: resultBase64 }), {
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error('Canvas overlay error:', err);
        const message = err instanceof Error ? err.message : String(err);
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
