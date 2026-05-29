import { Request, Response } from "express";
import { enqueueMatchingJob } from "../../infrastructure/queue/embedding.queue";
import prisma from "../../infrastructure/prisma/prisma.client";
export class HealthyController {


    public health = async (req: Request, res: Response) => {

     const job = await enqueueMatchingJob({ test: "data" });
        
        await prisma.pet.create({
            data: {
                name: "Fluffy"
            }
        })
        
        await prisma.pet.create({
            data: {
                name: "Spot"
            }
        })

        const pets = await prisma.pet.findMany();

        console.log(pets);
    
     res.status(200).json({
        status: "ok",
        uptime: process.uptime(),
        timestamp: Date.now()
        });
    };

}