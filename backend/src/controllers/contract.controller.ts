import { Request, Response, NextFunction } from 'express';
import { ContractService } from '../services/contract.service';
import { UnauthorizedError } from '../utils/errors';

export class ContractController {
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contract = await ContractService.createContract(req.body);

      res.status(201).json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getMyContracts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const contracts = await ContractService.getContractsForUser(req.user);

      res.status(200).json({
        success: true,
        data: contracts
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const contract = await ContractService.getContractById(req.params.id as string, req.user);

      res.status(200).json({
        success: true,
        data: contract
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await ContractService.updateContractStatus(req.params.id as string, req.body.status);

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }
}
