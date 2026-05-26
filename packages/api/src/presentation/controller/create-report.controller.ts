import { CreateReportUseCase } from "@application/usecase/create-report/create-report.usecase";
import { Request, Response } from "express";


export class CreateReportController {
    constructor(private useCase: CreateReportUseCase){}


    create = async (req: Request, res: Response): Promise<void> => {
   // console.log("Received request to create report with body:", req.body);

    const result = await this.useCase.execute(req.body)
     res.status(201).json();
    
    
    }
    


}