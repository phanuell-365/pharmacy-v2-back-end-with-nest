import { Test, TestingModule } from '@nestjs/testing';
import { MedicinesService } from './medicines.service';

describe('MedicinesService', () => {
  let service: MedicinesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedicinesService],
    }).compile();

    service = module.get<MedicinesService>(MedicinesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
