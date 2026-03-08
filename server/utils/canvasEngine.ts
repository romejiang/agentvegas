import { PersonalCanvas } from '../models/PersonalCanvas'
import { GlobalCanvas } from '../models/GlobalCanvas'
import mongoose from 'mongoose'

export interface PixelPaint {
    x: number;
    y: number;
    color: number;
}

export class CanvasEngine {

    // --- Personal Canvas ---
    async getPersonalCanvas(agentId: string) {
        let canvas = await PersonalCanvas.findOne({ agentId });
        if (!canvas) {
            canvas = await PersonalCanvas.create({ agentId, pixels: {} });
        }
        // Return simple object representation of Map
        return canvas.pixels ? Object.fromEntries(canvas.pixels as any) : {};
    }

    async paintPersonal(agentId: string, pixels: PixelPaint[]) {
        if (!pixels || pixels.length === 0) return { success: true };
        if (pixels.length > 1000) throw new Error('Maximum 1000 pixels per request');

        const setObj: Record<string, number> = {};
        for (const p of pixels) {
            if (p.x < 0 || p.x > 999 || p.y < 0 || p.y > 999) throw new Error('Pixel coordinates out of bounds (0-999)');
            if (p.color < 0 || p.color > 1023) throw new Error('Invalid color index (0-1023)');
            setObj[`pixels.${p.x},${p.y}`] = p.color;
        }

        await PersonalCanvas.updateOne(
            { agentId },
            { $set: setObj },
            { upsert: true }
        );

        return { success: true };
    }

    // --- Global Canvas ---
    async getGlobalCanvasChunks(startChunk: number, endChunk: number) {
        const chunks = await GlobalCanvas.find({
            chunkX: { $gte: startChunk, $lte: endChunk }
        });

        // Combine all chunks into one flat map of "x,y" => {color, agentId, timestamp}
        const flatPixels: Record<string, any> = {};
        for (const chunk of chunks) {
            if (chunk.pixels) {
                const chunkData = Object.fromEntries(chunk.pixels as any);
                for (const [key, value] of Object.entries(chunkData)) {
                    flatPixels[key] = value;
                }
            }
        }
        return flatPixels;
    }

    async paintGlobal(agentId: string, pixels: PixelPaint[]) {
        if (!pixels || pixels.length === 0) return { success: true };
        if (pixels.length > 1000) throw new Error('Maximum 1000 pixels per request');

        // Group pixels by chunkX (each chunk is 100px wide)
        const chunkGroups: Record<number, Record<string, any>> = {};
        const timestamp = new Date();

        for (const p of pixels) {
            if (p.x < 0 || p.x > 49999 || p.y < 0 || p.y > 999) throw new Error('Pixel coordinates out of bounds');
            if (p.color < 0 || p.color > 1023) throw new Error('Invalid color index (0-1023)');

            const chunkX = Math.floor(p.x / 100);
            if (!chunkGroups[chunkX]) chunkGroups[chunkX] = {};

            chunkGroups[chunkX][`pixels.${p.x},${p.y}`] = {
                color: p.color,
                agentId: agentId,
                timestamp: timestamp
            };
        }

        // Execute bulk write
        const bulkOps = Object.keys(chunkGroups).map(chunkStr => {
            const chunkX = parseInt(chunkStr, 10);
            return {
                updateOne: {
                    filter: { chunkX },
                    update: { $set: chunkGroups[chunkX] },
                    upsert: true
                }
            };
        });

        if (bulkOps.length > 0) {
            await GlobalCanvas.collection.bulkWrite(bulkOps as unknown as mongoose.mongo.AnyBulkWriteOperation[]);
        }

        return { success: true, count: pixels.length };
    }
}

export const canvasEngine = new CanvasEngine();
